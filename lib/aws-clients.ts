/**
 * AWS client factory — resolves credentials in this order:
 *
 *  1. Vercel OIDC  (VERCEL_OIDC_TOKEN + AWS_ROLE_ARN)
 *     Vercel issues a short-lived JWT per invocation; this exchanges it for
 *     temporary STS credentials via AssumeRoleWithWebIdentity.  No static
 *     keys are stored anywhere.
 *
 *  2. Static keys  (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)
 *     Used in local development.  Never commit these; set them in .env.local.
 *
 *  3. Default credential chain
 *     Covers Amplify compute execution roles, EC2 instance profiles, ECS task
 *     roles, etc.  When deployed to Amplify Hosting (SSR), the function runs
 *     with the Amplify service role — attach the required S3 policy there and
 *     no keys are needed at all.
 *
 * Call makeS3Client() inside request handlers (not at module level) so that
 * VERCEL_OIDC_TOKEN (which is per-invocation) is read at the right time.
 */

import { S3Client } from "@aws-sdk/client-s3"
import { fromWebToken } from "@aws-sdk/credential-providers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveCredentials(): any {
  // ── 1. Vercel OIDC ────────────────────────────────────────────────────────
  // Vercel sets VERCEL_OIDC_TOKEN per-invocation (enable in Project →
  // Settings → OpenID Connect). Exchange it for temporary STS credentials.
  const oidcToken = process.env.VERCEL_OIDC_TOKEN
  const roleArn   = process.env.AWS_ROLE_ARN
  if (oidcToken && roleArn) {
    return fromWebToken({
      roleArn,
      webIdentityToken: oidcToken,
      roleSessionName:  "vercel-portfolio",
    })
  }

  // ── 2. Static keys (local dev) ────────────────────────────────────────────
  const keyId  = process.env.AWS_ACCESS_KEY_ID
  const secret = process.env.AWS_SECRET_ACCESS_KEY
  if (keyId && secret) {
    return { accessKeyId: keyId, secretAccessKey: secret }
  }

  // ── 3. Default credential chain ───────────────────────────────────────────
  // Covers Amplify compute execution roles, EC2 instance profiles, ECS task
  // roles, etc.  undefined → SDK walks its built-in chain automatically.
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
