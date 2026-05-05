import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"
import { getSessionUser } from "@/lib/blog/auth"

export const runtime = "nodejs"

// Use explicit credentials only when provided (local dev).
// In production (Amplify/Lambda) omit credentials so the SDK uses the IAM execution role.
const s3 = new S3Client({
  region: process.env.AWS_S3_REGION ?? "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
  // Disable automatic checksum headers so presigned PUT URLs work from browsers
  // (older CORS-safe approach; checksum headers are not in the AllowedHeaders on S3).
  requestChecksumCalculation:  "WHEN_REQUIRED",
  responseChecksumValidation:  "WHEN_REQUIRED",
})

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
}

// Magic-byte signatures for server-side validation on the Lambda path
const MAGIC: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/jpg":  [[0xff, 0xd8, 0xff]],
  "image/png":  [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif":  [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
}

const MAX_AVATAR_BYTES  = 2 * 1024 * 1024   //  2 MB
const MAX_COMMENT_BYTES = 8 * 1024 * 1024   //  8 MB
// Files ≤ this threshold are uploaded through this Lambda (body validated here).
// Files above this threshold get a presigned S3 PUT URL so they bypass the
// API Gateway 6 MB body limit while still respecting the type/size limits.
const LAMBDA_THRESHOLD  = 4 * 1024 * 1024   //  4 MB  (safely under 6 MB gateway limit)

function checkMagicBytes(buf: Buffer, contentType: string): boolean {
  const sigs = MAGIC[contentType]
  if (!sigs) return false
  return sigs.some((sig) => sig.every((b, i) => buf[i] === b))
}

/**
 * POST (FormData with "file" + "purpose") — Lambda path for small files (≤ 4 MB).
 *   Validates magic bytes, type, size, then PUTs to S3 directly.
 *   → { cfUrl }
 *
 * POST (JSON { purpose, contentType, size }) — presigned path for larger files.
 *   Validates claimed type and size, then returns a presigned PUT URL for the client.
 *   → { uploadUrl, key, cfUrl }
 */
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

  const ct = req.headers.get("content-type") ?? ""

  // ── Lambda path (small file through Lambda body) ──────────────────────────
  if (ct.startsWith("multipart/form-data")) {
    let form: FormData
    try { form = await req.formData() } catch {
      return NextResponse.json({ error: "Invalid form data." }, { status: 400 })
    }

    const fileEntry = form.get("file")
    const purpose   = (form.get("purpose") as string | null) ?? "comment"

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 })
    }

    const contentType = fileEntry.type
    const ext = ALLOWED_TYPES[contentType]
    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP." },
        { status: 400 }
      )
    }

    const maxBytes = purpose === "avatar" ? MAX_AVATAR_BYTES : MAX_COMMENT_BYTES
    if (fileEntry.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum is ${maxBytes / 1024 / 1024} MB.` },
        { status: 413 }
      )
    }
    if (fileEntry.size > LAMBDA_THRESHOLD) {
      // Shouldn't reach here via normal client flow, but guard anyway
      return NextResponse.json(
        { error: "File too large for direct upload. Please use the presigned upload path." },
        { status: 413 }
      )
    }

    const arrayBuf = await fileEntry.arrayBuffer()
    const buf      = Buffer.from(arrayBuf)

    if (!checkMagicBytes(buf, contentType)) {
      return NextResponse.json(
        { error: "File content does not match its declared type." },
        { status: 400 }
      )
    }

    const folder = purpose === "avatar" ? `uploads/avatars/${user.id}` : "uploads/comments"
    const key    = `${folder}/${randomUUID()}.${ext}`

    try {
      await s3.send(new PutObjectCommand({
        Bucket:       process.env.AWS_S3_BUCKET!,
        Key:          key,
        Body:         buf,
        ContentType:  contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }))
    } catch (err) {
      console.error("[upload] S3 put error:", err)
      return NextResponse.json({ error: "Could not store file." }, { status: 500 })
    }

    const cfUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
    return NextResponse.json({ cfUrl })
  }

  // ── Presigned path (large file — browser PUTs directly to S3) ────────────
  let body: { purpose?: string; contentType?: string; size?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { purpose = "comment", contentType, size } = body

  if (!contentType) {
    return NextResponse.json({ error: "contentType is required." }, { status: 400 })
  }

  const ext = ALLOWED_TYPES[contentType]
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP." },
      { status: 400 }
    )
  }

  const maxBytes = purpose === "avatar" ? MAX_AVATAR_BYTES : MAX_COMMENT_BYTES
  if (size !== undefined && size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Maximum is ${maxBytes / 1024 / 1024} MB.` },
      { status: 413 }
    )
  }
  if (size !== undefined && size <= LAMBDA_THRESHOLD) {
    // Client should have used the multipart path; reject to enforce the intended flow
    return NextResponse.json(
      { error: "Small files must be uploaded through the direct Lambda path." },
      { status: 400 }
    )
  }

  const folder   = purpose === "avatar" ? `uploads/avatars/${user.id}` : "uploads/comments"
  const key      = `${folder}/${randomUUID()}.${ext}`

  let uploadUrl: string
  try {
    uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket:           process.env.AWS_S3_BUCKET!,
        Key:              key,
        ContentType:      contentType,
        CacheControl:     "public, max-age=31536000, immutable",
      }),
      { expiresIn: 300 }
    )
  } catch (err) {
    console.error("[upload] presign error:", err)
    return NextResponse.json({ error: "Could not generate upload URL." }, { status: 500 })
  }

  const cfUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
  return NextResponse.json({ uploadUrl, key, cfUrl })
}
