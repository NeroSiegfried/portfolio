/**
 * AWS client factory — resolves credentials in this order:
 *
 *  1. Vercel OIDC  (VERCEL_OIDC_TOKEN + AWS_ROLE_ARN)
 *     Vercel exchanges a per-invocation JWT for temporary STS credentials.
 *
 *  2. Scoped service account  (S3_UPLOADER_KEY_ID + S3_UPLOADER_SECRET)
 *     A dedicated IAM user with ONLY s3:PutObject on uploads/* — used by
 *     Amplify/Vercel compute environments that don't expose an execution role.
 *     These are NOT personal admin keys. Stored as S3_UPLOADER_* env vars
 *     (Amplify blocks AWS_* prefix; Vercel uses encrypted env vars).
 *
 *  3. SDK node provider chain  (local dev)
 *     Reads ~/.aws/credentials or AWS_* env vars from your shell.
 *
 * Call makeS3Client() inside request handlers so VERCEL_OIDC_TOKEN is read
 * at request time, not at cold-start.
 */

import { S3Client } from "@aws-sdk/client-s3"
import { fromNodeProviderChain, fromWebToken } from "@aws-sdk/credential-providers"

function resolveCredentials() {
  // ── 1. Vercel OIDC ────────────────────────────────────────────────────────
  const oidcToken = process.env.VERCEL_OIDC_TOKEN
  const roleArn   = process.env.AWS_ROLE_ARN
  if (oidcToken && roleArn) {
    console.log("[aws-clients] credentials: Vercel OIDC")
    return fromWebToken({ roleArn, webIdentityToken: oidcToken, roleSessionName: "vercel-portfolio" })
  }

  // ── 2. Scoped service account ─────────────────────────────────────────────
  // Amplify Gen 1 WEB_COMPUTE doesn't inject execution-role credentials into
  // the SSR runtime — the service role is build-only. We use a dedicated IAM
  // user scoped to s3:PutObject on uploads/* only.
  const keyId  = process.env.S3_UPLOADER_KEY_ID
  const secret = process.env.S3_UPLOADER_SECRET
  if (keyId && secret) {
    console.log("[aws-clients] credentials: S3_UPLOADER service account")
    return { accessKeyId: keyId, secretAccessKey: secret }
  }

  // ── 3. SDK node provider chain  (local dev) ───────────────────────────────
  console.log("[aws-clients] credentials: SDK node provider chain")
  return fromNodeProviderChain()
}

/** Creates a pre-configured S3 client for the portfolio media bucket. */
export function makeS3Client(): S3Client {
  return new S3Client({
    region:      process.env.AWS_S3_REGION ?? process.env.S3_REGION ?? "us-east-1",
    credentials: resolveCredentials(),
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
}
