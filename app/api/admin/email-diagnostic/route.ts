import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/blog/auth"
import { sendEmail } from "@/lib/email/ses"

export const runtime = "nodejs"

function credentialPath() {
  if (process.env.VERCEL_OIDC_TOKEN && process.env.AWS_ROLE_ARN) return "vercel_oidc"
  if (process.env.S3_UPLOADER_KEY_ID && process.env.S3_UPLOADER_SECRET) return "s3_uploader"
  return "node_provider_chain"
}

export async function POST() {
  const admin = await requireAdminUser()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const provider = credentialPath()
  try {
    await sendEmail({
      to: "success@simulator.amazonses.com",
      subject: "Portfolio production email diagnostic",
      text: "Admin-requested SES diagnostic.",
      html: "<p>Admin-requested SES diagnostic.</p>",
    })
    return NextResponse.json({ ok: true, provider })
  } catch (error) {
    const err = error as Error & {
      Code?: string
      code?: string
      $metadata?: { httpStatusCode?: number }
    }
    return NextResponse.json(
      {
        ok: false,
        provider,
        error: {
          name: err.name,
          code: err.Code ?? err.code,
          message: err.message,
          httpStatus: err.$metadata?.httpStatusCode,
        },
      },
      { status: 500 },
    )
  }
}
