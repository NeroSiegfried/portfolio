/** Minimal, client-safe HTML email templates (inline styles required for email). */

function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0b0b0c;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e9e4de">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#141416;border:1px solid #262629;border-radius:6px;overflow:hidden">
      <tr><td style="padding:28px 32px">
        ${inner}
      </td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:12px;color:#7c7770">Victor Nabasu · nerosiegfried.com</p>
  </td></tr></table>
</body></html>`
}

const btn = `display:inline-block;background:#FB460D;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-weight:600;font-size:14px`
const muted = `color:#8a857e;font-size:13px;line-height:1.6`

export function confirmEmail(confirmUrl: string, unsubUrl: string) {
  const html = shell(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#fff">Confirm your subscription</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#c9c4bd">
      Thanks for subscribing to Victor Nabasu&rsquo;s build-log newsletter — databases, DSLs, systems and shipped projects. Confirm your email to start receiving posts.
    </p>
    <p style="margin:0 0 24px"><a href="${confirmUrl}" style="${btn}">Confirm subscription</a></p>
    <p style="margin:0 0 20px;${muted}">If the button doesn&rsquo;t work, paste this link into your browser:<br><a href="${confirmUrl}" style="color:#FB460D;word-break:break-all">${confirmUrl}</a></p>
    <hr style="border:none;border-top:1px solid #262629;margin:20px 0">
    <p style="margin:0;${muted}">You received this because this address was entered on nerosiegfried.com. If that wasn&rsquo;t you, ignore this email or <a href="${unsubUrl}" style="color:#8a857e">unsubscribe</a>.</p>
  `)
  const text = `Confirm your subscription to Victor Nabasu's newsletter:\n${confirmUrl}\n\nIf that wasn't you, ignore this email or unsubscribe: ${unsubUrl}`
  return { html, text }
}

export function contactNotificationEmail(name: string, email: string, message: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const html = shell(`
    <h1 style="margin:0 0 16px;font-size:18px;color:#fff">New message from your site</h1>
    <p style="margin:0 0 6px;${muted}">Name</p>
    <p style="margin:0 0 16px;font-size:14px;color:#e9e4de">${esc(name)}</p>
    <p style="margin:0 0 6px;${muted}">Email</p>
    <p style="margin:0 0 16px;font-size:14px"><a href="mailto:${esc(email)}" style="color:#FB460D">${esc(email)}</a></p>
    <p style="margin:0 0 6px;${muted}">Message</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#e9e4de;white-space:pre-wrap">${esc(message)}</p>
  `)
  const text = `New message from your site\n\nName: ${name}\nEmail: ${email}\n\n${message}`
  return { html, text }
}
