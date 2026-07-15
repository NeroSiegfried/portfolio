import {
  PutObjectTaggingCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { makeS3Client } from "@/lib/aws-clients"

/**
 * Media lifecycle helpers.
 *
 * Model (owner decision): **uploaded images are permanent.** An object is only
 * ever removed when the blog's own code determines it is orphaned. To let a
 * safety-net S3 lifecycle rule expire *only* orphans the code can't see, every
 * object under `uploads/` carries a `keep` tag:
 *
 *   • created as `keep=false` by the upload route (see app/api/upload/route.ts)
 *   • flipped to `keep=true` the moment a post/comment/avatar that references it
 *     is saved (`markReferenced`)
 *   • deleted outright when the referencing content is deleted or the image is
 *     dropped on edit (`deleteImages`)  ← the primary, code-driven GC
 *
 * The bucket lifecycle rule expires `uploads/` objects still tagged `keep=false`
 * after a 30-day grace period — i.e. uploads that were never confirmed to be
 * referenced (abandoned drafts/comments the code has no record of). Referenced
 * objects are `keep=true` and are never touched. See lib/blog/media-sweep.ts for
 * the reconciliation sweep that is the primary orphan finder and self-heals tags.
 *
 * Requires IAM: s3:PutObject, s3:PutObjectTagging, s3:GetObject, s3:DeleteObject,
 * s3:ListBucket on uploads/* and media/* (see aws/iam-uploader-policy.json).
 */

export const CF_DOMAIN = () => process.env.AWS_CLOUDFRONT_DOMAIN ?? process.env.CLOUDFRONT_DOMAIN ?? ""
export const BUCKET = () => process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET ?? ""

/** Object-tag values controlling the lifecycle backstop. */
export const KEEP_TAG_KEY = "keep"
/** Value the upload route writes so the backstop can expire abandoned uploads. */
export const KEEP_TEMP = "false"
/** Value written once an object is confirmed referenced — never expired. */
export const KEEP_PERMANENT = "true"
/** `x-amz-tagging` header value the client must echo on the presigned PUT. */
export const UPLOAD_TAGGING = `${KEEP_TAG_KEY}=${KEEP_TEMP}`

/** Turns one of our CloudFront URLs back into its S3 object key, or null. */
export function extractKey(url: string): string | null {
  const cf = CF_DOMAIN()
  if (!cf || !url) return null
  const prefix = `https://${cf}/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}

/** Every distinct CloudFront URL embedded in a block of markdown/HTML. */
export function imageUrlsIn(content: string | null | undefined): string[] {
  const cf = CF_DOMAIN()
  if (!content || !cf) return []
  const base = `https://${cf}/`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`${base}[^\\s)"'<>\\]]+`, "g")
  return [...new Set(content.match(re) ?? [])]
}

/** Collect the managed S3 keys referenced by any of the given URLs, filtered to
 *  our prefixes. `onlyUploads` restricts to the lifecycle-managed `uploads/`. */
function keysFrom(urls: Iterable<string>, onlyUploads: boolean): Set<string> {
  const keys = new Set<string>()
  for (const u of urls) {
    const k = extractKey(u)
    if (!k) continue
    if (onlyUploads ? k.startsWith("uploads/") : k.startsWith("uploads/") || k.startsWith("media/")) {
      keys.add(k)
    }
  }
  return keys
}

/**
 * Mark the given images as permanently kept (`keep=true`) so the lifecycle
 * backstop never expires them. Best-effort — a failed tag is re-applied by the
 * reconciliation sweep. Only `uploads/` objects carry the rule, so `media/`
 * (legacy permanent) objects are skipped.
 */
export async function markReferenced(urls: Iterable<string>): Promise<void> {
  const bucket = BUCKET()
  if (!bucket) return
  const keys = keysFrom(urls, true)
  if (!keys.size) return
  const s3 = makeS3Client()
  await Promise.all(
    [...keys].map((Key) =>
      s3
        .send(new PutObjectTaggingCommand({ Bucket: bucket, Key, Tagging: { TagSet: [{ Key: KEEP_TAG_KEY, Value: KEEP_PERMANENT }] } }))
        .catch((err) => console.error("[media] markReferenced failed for", Key, err)),
    ),
  )
}

/**
 * Permanently delete the given images (the primary, code-driven GC — called
 * when a post/comment is deleted or an image is dropped on edit). Guards to our
 * own `uploads/` and `media/` prefixes so an unexpected URL can never delete an
 * arbitrary object. Best-effort; failures are logged, not thrown.
 */
export async function deleteImages(urls: Iterable<string>): Promise<void> {
  const bucket = BUCKET()
  if (!bucket) return
  const keys = keysFrom(urls, false)
  if (!keys.size) return
  const s3 = makeS3Client()
  await Promise.all(
    [...keys].map((Key) =>
      s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key }))
        .catch((err) => console.error("[media] delete failed for", Key, err)),
    ),
  )
}

// ── Reconciliation-sweep primitives (used by lib/blog/media-sweep.ts) ─────────

export interface StoredObject {
  key: string
  lastModified?: Date
}

/** List every object under a prefix, following pagination. */
export async function listObjects(prefix: string): Promise<StoredObject[]> {
  const bucket = BUCKET()
  if (!bucket) return []
  const s3 = makeS3Client()
  const out: StoredObject[] = []
  let ContinuationToken: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken }),
    )
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push({ key: o.Key, lastModified: o.LastModified })
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (ContinuationToken)
  return out
}

/** Best-effort set the `keep` tag on a single key. */
export async function setKeepTag(key: string, keep: boolean): Promise<void> {
  const bucket = BUCKET()
  if (!bucket) return
  const s3 = makeS3Client()
  await s3
    .send(
      new PutObjectTaggingCommand({
        Bucket: bucket,
        Key: key,
        Tagging: { TagSet: [{ Key: KEEP_TAG_KEY, Value: keep ? KEEP_PERMANENT : KEEP_TEMP }] },
      }),
    )
    .catch((err) => console.error("[media] setKeepTag failed for", key, err))
}

/** Best-effort delete a single key (already known to be one of ours). */
export async function deleteKey(key: string): Promise<void> {
  const bucket = BUCKET()
  if (!bucket) return
  const s3 = makeS3Client()
  await s3
    .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    .catch((err) => console.error("[media] deleteKey failed for", key, err))
}
