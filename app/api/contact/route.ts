// app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Load environment variables from .env.local:
//   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
//
// e.g. use a dedicated SMTP service like Gmail, SendGrid, or ProtonMail.
// Below is an example using a Gmail SMTP account. Adapt as needed.

export async function POST(request: NextRequest) {
  const { name, email, message } = await request.json()

  // Create a Nodemailer transporter:
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., 'smtp.gmail.com'
    port: Number(process.env.EMAIL_PORT), // e.g., 587
    secure: false, // true for port 465, false for 587
    auth: {
      user: process.env.EMAIL_USER, // your SMTP username
      pass: process.env.EMAIL_PASS, // your SMTP password/App Password :contentReference[oaicite:4]{index=4}
    },
  })

  try {
    await transporter.sendMail({
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: "victornabasu@yahoo.com",
      subject: `New message from ${name}`,
      text: `
        You’ve received a new message from your site:

        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      // Optionally add HTML:
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong><br/>${message}</p>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
