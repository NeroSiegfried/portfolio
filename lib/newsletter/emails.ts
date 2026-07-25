/** Client-safe HTML email templates. Styles stay inline for broad email support. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function shell(inner: string, preheader: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Victor Nabasu</title>
</head>
<body style="margin:0;padding:0;background:#0b0b0c;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ebe7e1;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#0b0b0c">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
          <tr>
            <td style="padding:0 0 16px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#f04a18">VN / Field notes</td>
                  <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;color:#817c75">nerosiegfried.com</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="border-top:4px solid #f04a18;border-right:1px solid #2a292b;border-bottom:1px solid #2a292b;border-left:1px solid #2a292b;background:#151517;padding:36px 38px">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 4px 0;font-size:11px;line-height:1.7;color:#77726c">
              <strong style="color:#a7a19a">Victor Nabasu</strong><br>
              Software engineer · London &amp; remote
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const button = "display:inline-block;background:#f04a18;color:#ffffff;text-decoration:none;padding:14px 22px;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:700;line-height:1.2;letter-spacing:1.2px;text-transform:uppercase"
const eyebrow = "margin:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#f04a18"
const muted = "color:#918b84;font-size:12px;line-height:1.7"

export function confirmEmail(confirmUrl: string, unsubUrl: string) {
  const safeConfirmUrl = escapeHtml(confirmUrl)
  const safeUnsubUrl = escapeHtml(unsubUrl)
  const html = shell(`
    <p style="${eyebrow}">One last step</p>
    <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:1.2;color:#ffffff">Confirm your subscription.</h1>
    <p style="margin:0 0 26px;font-size:14px;line-height:1.75;color:#c9c4bd">
      You&rsquo;re nearly on the list. Confirm your address to receive practical build logs on databases, DSLs, systems, and shipped projects.
    </p>
    <p style="margin:0 0 28px"><a href="${safeConfirmUrl}" style="${button}">Confirm subscription&nbsp; →</a></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #2a292b;background:#101012">
      <tr><td style="padding:14px 16px;${muted}">Double opt-in keeps the list human and your inbox protected. No tracking pixels. Unsubscribe whenever you like.</td></tr>
    </table>
    <p style="margin:0 0 22px;${muted}">Button not working? Copy this address into your browser:<br><a href="${safeConfirmUrl}" style="color:#f2764f;word-break:break-all;text-decoration:underline">${safeConfirmUrl}</a></p>
    <hr style="border:0;border-top:1px solid #2a292b;margin:0 0 20px">
    <p style="margin:0;${muted}">This was requested on nerosiegfried.com. If it wasn&rsquo;t you, ignore this message or <a href="${safeUnsubUrl}" style="color:#a7a19a;text-decoration:underline">remove this address</a>.</p>
  `, "Confirm your email to receive Victor Nabasu’s field notes.")
  const text = `Confirm your subscription to Victor Nabasu's newsletter:\n${confirmUrl}\n\nIf that wasn't you, ignore this email or unsubscribe: ${unsubUrl}`
  return { html, text }
}

export function contactNotificationEmail(name: string, email: string, message: string) {
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message)
  const html = shell(`
    <p style="${eyebrow}">Portfolio enquiry</p>
    <h1 style="margin:0 0 26px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:1.2;color:#ffffff">New message from ${safeName}.</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse">
      <tr>
        <td width="84" valign="top" style="padding:0 12px 14px 0;${muted};font-family:'Courier New',Courier,monospace;text-transform:uppercase;letter-spacing:1px">From</td>
        <td valign="top" style="padding:0 0 14px;font-size:14px;line-height:1.5;color:#ebe7e1">${safeName}</td>
      </tr>
      <tr>
        <td width="84" valign="top" style="padding:0 12px 18px 0;${muted};font-family:'Courier New',Courier,monospace;text-transform:uppercase;letter-spacing:1px">Reply</td>
        <td valign="top" style="padding:0 0 18px;font-size:14px;line-height:1.5"><a href="mailto:${safeEmail}" style="color:#f2764f;text-decoration:underline">${safeEmail}</a></td>
      </tr>
    </table>
    <div style="margin:0 0 26px;border-left:3px solid #f04a18;background:#101012;padding:18px 20px;font-size:14px;line-height:1.75;color:#ddd8d1;white-space:pre-wrap;overflow-wrap:anywhere">${safeMessage}</div>
    <p style="margin:0"><a href="mailto:${safeEmail}" style="${button}">Reply to ${safeName}&nbsp; →</a></p>
  `, `New portfolio enquiry from ${name}.`)
  const text = `New message from your site\n\nName: ${name}\nEmail: ${email}\n\n${message}`
  return { html, text }
}
