/**
 * AWS client factory — resolves credentials without storing any keys:
 *
 *  1. Vercel OIDC  (VERCEL_OIDC_TOKEN + AWS_ROLE_ARN)
 *     Vercel issues a short-lived JWT per invocation; this exchanges it for
 *     temporary STS credentials via AssumeRoleWithWebIdentity.
 *     Setup: enable OpenID Connect in Vercel project settings, create an IAM
 *     OIDC provider for https://oidc.vercel.com and an IAM role that trusts
 *     it, then set AWS_ROLE_ARN=<that role ARN> in Vercel env vars.
 *
 *  2. SDK default credential chain  (everything else)
 *     On Amplify / Lambda: the runtime automatically injects execution-role
 *     credentials (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY +
 *     AWS_SESSION_TOKEN) — the SDK picks these up automatically with the
 *     correct session token; no manual key handling needed.
 *     Locally: uses ~/.aws/credentials or env vars set in your shell.
 *
 * NO static keys are stored anywhere.  Call makeS3Client() inside request
 * handlers (not at module level) so VERCEL_OIDC_TOKEN is read per-invocation.
 */

import { S3Client } from "@aws-sdk/client-s3"
import { fromWebToken } from "@aws-sdk/credential-providers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveCredentials(): any {
  // ── 1. Vercel OIDC ────────────────────────────────────────────────────────
  const oidcToken = process.env.VERCEL_OIDC_TOKEN
  const roleArn   = process.env.AWS_ROLE_ARN
  if (oidcToken && roleArn) {
    return fromWebToken({
      roleArn,
      webIdentityToken: oidcToken,
      roleSessionName:  "vercel-portfolio",
    })
  }

  // ── 2. SDK default chain ─────────────────────────────────────────────────
  // On Lambda/Amplify: runtime injects execution-role creds automatically.
  // Locally: reads ~/.aws/credentials or AWS_* env vars from your shell.
  return undefined
}

/** Creates a pre-configured S3 client for the portfolio media bucket.
 *  Call inside request handlers (not at module level) so VERCEL_OIDC_TOKEN
 *  is read at request time, not at cold-start / module initialisation. */
export function makeS3Client(): S3Client {
  return new S3Client({
    region:   process.env.AWS_S3_REGION ?? process.env.S3_REGION ?? "us-east-1",
    credentials: resolveCredentials(),
    // Suppress x-amz-checksum-* from presigned URLs — they trigger CORS
    // preflight failures in the browser when PUT-ing directly to S3.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
}
