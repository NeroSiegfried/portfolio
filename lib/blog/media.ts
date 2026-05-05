import { S3Client, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION ?? "us-east-1",
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const CF_DOMAIN = () => process.env.AWS_CLOUDFRONT_DOMAIN ?? ""
const BUCKET    = () => process.env.AWS_S3_BUCKET ?? ""

function extractKey(url: string): string | null {
  const prefix = `https://${CF_DOMAIN()}/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

/**
 * Copies every `uploads/` S3 object referenced in `markdownContent` to a
 * permanent `targetPrefix/` location (no lifecycle rule), updates the URLs in
 * the returned string, and best-effort deletes the originals (the 14-day
 * lifecycle rule handles them anyway if the delete fails).
 *
 * Call this after inserting a comment so orphaned uploads eventually expire
 * while used images are kept forever.
 */
export async function permanentizeImages(
  content: string,
  targetPrefix: string   // e.g. "media/comments/abc-123"
): Promise<string> {
  const cfBase = `https://${CF_DOMAIN()}/`
  if (!content || !CF_DOMAIN() || !BUCKET() || !cfBase) return content

  // Find all unique CloudFront `uploads/` URLs embedded in the content
  const escapedBase = cfBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const urlRegex = new RegExp(`${escapedBase}uploads/[^\\s)"']+`, "g")
  const matches  = [...new Set(content.match(urlRegex) ?? [])]
  if (!matches.length) return content

  let updated = content
  for (const oldUrl of matches) {
    const oldKey = extractKey(oldUrl)
    if (!oldKey || !oldKey.startsWith("uploads/")) continue

    const ext    = oldKey.split(".").pop() ?? "jpg"
    const newKey = `${targetPrefix}/${randomUUID()}.${ext}`

    try {
      await s3.send(new CopyObjectCommand({
        Bucket:            BUCKET(),
        CopySource:        `${BUCKET()}/${oldKey}`,
        Key:               newKey,
        CacheControl:      "public, max-age=31536000, immutable",
        MetadataDirective: "COPY",
      }))

      const newUrl = `${cfBase}${newKey}`
      updated = updated.split(oldUrl).join(newUrl)

      // Best-effort delete of the short-lived upload copy
      s3.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: oldKey })).catch(() => {})
    } catch (err) {
      console.error("[media] permanentize failed for", oldKey, err)
      // Leave the original URL — it will still serve for 14 days
    }
  }

  return updated
}

/**
 * Same as permanentizeImages but for a single URL (e.g. avatar_url).
 * Returns the permanent URL, or the original if it's already permanent / copy fails.
 */
export async function permanentizeUrl(
  url: string,
  targetPrefix: string   // e.g. "media/avatars/user-id"
): Promise<string> {
  const cfBase = `https://${CF_DOMAIN()}/`
  if (!url || !CF_DOMAIN() || !BUCKET()) return url

  const key = extractKey(url)
  if (!key || !key.startsWith("uploads/")) return url   // Already permanent or external URL

  const ext    = key.split(".").pop() ?? "jpg"
  const newKey = `${targetPrefix}/${randomUUID()}.${ext}`

  try {
    await s3.send(new CopyObjectCommand({
      Bucket:            BUCKET(),
      CopySource:        `${BUCKET()}/${key}`,
      Key:               newKey,
      CacheControl:      "public, max-age=31536000, immutable",
      MetadataDirective: "COPY",
    }))

    s3.send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key })).catch(() => {})
    return `${cfBase}${newKey}`
  } catch (err) {
    console.error("[media] permanentizeUrl failed for", key, err)
    return url
  }
}
