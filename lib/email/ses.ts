import { SendEmailCommand } from "@aws-sdk/client-sesv2"
import { makeSesClient } from "@/lib/aws-clients"

/**
 * Transactional email via Amazon SES v2. Uses the same AWS credential chain as
 * S3 (Vercel OIDC role in prod — no API key). Requires:
 *   EMAIL_FROM             — verified SES sender, e.g. "Victor Nabasu <noreply@nerosiegfried.com>"
 *   SES_CONFIGURATION_SET  — (optional) config set for bounce/complaint event tracking
 *   AWS_SES_REGION         — (optional) SES region, defaults to AWS_S3_REGION / us-east-1
 */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Victor Nabasu <noreply@nerosiegfried.com>"

export interface SendArgs {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  headers?: Record<string, string>
}

export async function sendEmail(args: SendArgs) {
  const to = Array.isArray(args.to) ? args.to : [args.to]
  const headers = args.headers
    ? Object.entries(args.headers).map(([Name, Value]) => ({ Name, Value }))
    : undefined

  const res = await makeSesClient().send(
    new SendEmailCommand({
      FromEmailAddress: EMAIL_FROM,
      Destination: { ToAddresses: to },
      ReplyToAddresses: args.replyTo ? [args.replyTo] : undefined,
      ConfigurationSetName: process.env.SES_CONFIGURATION_SET || undefined,
      Content: {
        Simple: {
          Subject: { Data: args.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: args.html, Charset: "UTF-8" },
            ...(args.text ? { Text: { Data: args.text, Charset: "UTF-8" } } : {}),
          },
          ...(headers ? { Headers: headers } : {}),
        },
      },
    }),
  )
  return { id: res.MessageId }
}
