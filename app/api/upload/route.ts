import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { getSessionUser } from "@/lib/blog/auth"

// Body size limit for this route (Vercel default is 4.5MB; we enforce 8MB max at upload)
export const runtime = "nodejs"

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
}

// Max file sizes (client compresses images before upload; GIFs come as-is)
const MAX_AVATAR_BYTES = 2 * 1024 * 1024   // 2 MB
const MAX_COMMENT_BYTES = 8 * 1024 * 1024  // 8 MB

function checkMagicBytes(buf: Buffer, mime: string): boolean {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    case "image/png":
      return buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
    case "image/gif":
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46
    case "image/webp":
      return (
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
      )
    default:
      return false
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Login required." }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid multipart body." }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  const purpose = (formData.get("purpose") as string | null) ?? "comment"  // "avatar" | "comment"

  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 })

  const mime = file.type
  const ext = ALLOWED_TYPES[mime]
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP." },
      { status: 400 }
    )
  }

  const maxBytes = purpose === "avatar" ? MAX_AVATAR_BYTES : MAX_COMMENT_BYTES
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Maximum is ${maxBytes / 1024 / 1024} MB.` },
      { status: 413 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (!checkMagicBytes(buffer, mime)) {
    return NextResponse.json(
      { error: "File content does not match its declared type." },
      { status: 400 }
    )
  }

  const folder =
    purpose === "avatar" ? `uploads/avatars/${user.id}` : "uploads/comments"
  const key = `${folder}/${randomUUID()}.${ext}`

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    )
  } catch (err) {
    console.error("[upload] S3 error:", err)
    return NextResponse.json({ error: "Storage error. Please try again." }, { status: 502 })
  }

  const url = `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`
  return NextResponse.json({ url })
}
