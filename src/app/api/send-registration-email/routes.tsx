// app/api/send-registration-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configure your email service (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD, // App password
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, masterclassTitle, speakerName, scheduledDate, masterclassId } = await req.json();

    if (!email || !masterclassTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const formattedDate = scheduledDate 
      ? new Date(scheduledDate).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "TBA";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #4f46e5;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
          }
          .info-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4f46e5;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Registration Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>Thank you for registering for our upcoming masterclass!</p>
          
          <div class="info-box">
            <h3>📚 ${masterclassTitle}</h3>
            <p><strong>Speaker:</strong> ${speakerName}</p>
            <p><strong>📅 Scheduled Date:</strong> ${formattedDate}</p>
          </div>

          <p>We're excited to have you join us! Here's what happens next:</p>
          <ul>
            <li>✅ Your registration is confirmed</li>
            <li>📧 You'll receive a reminder email 24 hours before the class</li>
            <li>🔗 Access link will be sent 30 minutes before start time</li>
            <li>💬 Q&A session will be available during the class</li>
          </ul>

          <center>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/masterclasses/${masterclassId}" class="button">
              View Masterclass Details
            </a>
          </center>

          <p><strong>Important:</strong> Add this event to your calendar so you don't miss it!</p>
          
          <p>If you have any questions, feel free to reach out to us.</p>
          
          <p>Best regards,<br><strong>Your Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Masterclass Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Registration Confirmed: ${masterclassTitle}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}