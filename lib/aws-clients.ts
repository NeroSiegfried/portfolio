/**
 * AWS client factory — resolves credentials without storing any keys:
 *
 *  1. Vercel OIDC  (VERCEL_OIDC_TOKEN + AWS_ROLE_ARN)
 *     Vercel issues a short-lived JWT per invocation; this exchanges it for
 *     temporary STS credentials via AssumeRoleWithWebIdentity.
 *
 *  2. SDK node provider chain  (everything else)
 *     On Amplify / Lambda: runtime injects execution-role creds via
 *     AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_SESSION_TOKEN.
 *     Locally: uses ~/.aws/credentials or env vars in your shell.
 *
 * NO static keys are stored anywhere.  Call makeS3Client() inside request
 * handlers (not at module level) so VERCEL_OIDC_TOKEN is read per-invocation.
 */

import { S3Client } from "@aws-sdk/client-s3"
import { fromNodeProviderChain, fromWebToken } from "@aws-sdk/credential-providers"

function resolveCredentials() {
  // ── 1. Vercel OIDC ────────────────────────────────────────────────────────
  const oidcToken = process.env.VERCEL_OIDC_TOKEN
  const roleArn   = process.env.AWS_ROLE_ARN
  if (oidcToken && roleArn) {
    console.log("[aws-clients] using Vercel OIDC credential provider")
    return fromWebToken({
      roleArn,
      webIdentityToken: oidcToken,
      roleSessionName:  "vercel-portfolio",
    })
  }

  // ── 2. Node provider chain ────────────────────────────────────────────────
  // Covers Lambda execution role (env vars injected by runtime), EC2 instance
  // profiles, ECS task roles, and local ~/.aws/credentials.
  // Explicitly using fromNodeProviderChain() rather than passing undefined so
  // the full chain (including container/IMDS metadata) is always tried.
  console.log("[aws-clients] using SDK node provider chain (VERCEL_OIDC_TOKEN present:", !!oidcToken, "AWS_ROLE_ARN present:", !!roleArn, ")")
  return fromNodeProviderChain()
}

/** Creates a pre-configured S3 client for the portfolio media bucket.
 *  Call inside request handlers (not at module level) so VERCEL_OIDC_TOKEN
 *  is read at request time, not at cold-start / module initialisation. */
export function makeS3Client(): S3Client {
  return new S3Client({
    region:      process.env.AWS_S3_REGION ?? process.env.S3_REGION ?? "us-east-1",
    credentials: resolveCredentials(),
    // Suppress x-amz-checksum-* from presigned URLs — they trigger CORS
    // preflight failures in the browser when PUT-ing directly to S3.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  })
}
