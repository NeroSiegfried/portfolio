import { NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"
import { getSessionUser } from "@/lib/blog/auth"
import { makeS3Client } from "@/lib/aws-clients"

export const runtime = "nodejs"

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
}

const MAX_AVATAR_BYTES  = 2 * 1024 * 1024   //  2 MB
const MAX_COMMENT_BYTES = 8 * 1024 * 1024   //  8 MB

/**
 * POST { purpose: "avatar"|"comment", contentType: string, size: number }
 * Returns { uploadUrl, key, cfUrl }
 *
 * File bytes never reach this server (no Vercel body-size limit in the path).
 * The client validates magic bytes locally, then PUTs directly to S3.
 * Size and type are enforced here before the presigned URL is issued.
 */
export async function POST(req: Request) {
  const s3   = makeS3Client()
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

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

  const folder = purpose === "avatar" ? `uploads/avatars/${user.id}` : "uploads/comments"
  const key    = `${folder}/${randomUUID()}.${ext}`

  let uploadUrl: string
  try {
    uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket:       (process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET)!,
        Key:          key,
        ContentType:  contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 300 }
    )
  } catch (err) {
    console.error("[upload] presign error:", err)
    return NextResponse.json({ error: "Could not generate upload URL." }, { status: 500 })
  }

  const cfUrl = `https://${process.env.AWS_CLOUDFRONT_DOMAIN ?? process.env.CLOUDFRONT_DOMAIN}/${key}`
  return NextResponse.json({ uploadUrl, key, cfUrl })
}
