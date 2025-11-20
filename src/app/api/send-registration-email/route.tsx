// app/api/send-registration-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { 
      email, 
      masterclassTitle, 
      speakerName, 
      scheduledDate, 
      masterclassId,
      userName 
    } = await req.json();

    if (!email || !masterclassTitle) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const scheduledDateTime = scheduledDate ? new Date(scheduledDate) : null;
    const now = new Date();
    
    // Calculate time difference
    const timeDiff = scheduledDateTime 
      ? scheduledDateTime.getTime() - now.getTime() 
      : Infinity;
    const hoursUntilEvent = timeDiff / (1000 * 60 * 60);

    const formattedDate = scheduledDateTime 
      ? scheduledDateTime.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
      : "TBA";

    // Determine if we need to send immediate reminder
    const needsImmediateReminder = hoursUntilEvent <= 2;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            margin: 20px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 30px;
          }
          .button {
            display: inline-block;
            background: #4f46e5;
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
          }
          .info-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #4f46e5;
          }
          .info-box h3 {
            margin-top: 0;
            color: #1f2937;
          }
          .urgent-box {
            background: #fef2f2;
            border-left-color: #ef4444;
            border: 2px solid #ef4444;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .urgent-box h3 {
            color: #dc2626;
            margin-top: 0;
          }
          .checklist {
            background: #f0fdf4;
            padding: 15px 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .checklist ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .checklist li {
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background: #f9fafb;
            color: #6b7280;
            font-size: 14px;
          }
          .highlight {
            color: #4f46e5;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName || "there"}!</h2>
            <p>Great news! You're all set for the upcoming masterclass.</p>
            
            <div class="info-box">
              <h3>📚 ${masterclassTitle}</h3>
              <p><strong>Speaker:</strong> ${speakerName}</p>
              <p><strong>📅 Scheduled:</strong> ${formattedDate}</p>
            </div>

            ${needsImmediateReminder ? `
              <div class="urgent-box">
                <h3>⚠️ Starting Soon!</h3>
                <p>This masterclass is starting in less than 2 hours! Make sure you're ready to join.</p>
              </div>
            ` : `
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>✅ Your registration is confirmed</li>
                <li>📧 You'll receive a reminder email <strong>24 hours</strong> before the class</li>
                <li>🔔 Another reminder will be sent <strong>2 hours</strong> before start time</li>
                <li>🔗 The join link will be included in the reminder emails</li>
                <li>💬 Q&A session will be available during the class</li>
              </ul>
            `}

            <div class="checklist">
              <strong>📝 Preparation Checklist:</strong>
              <ul>
                <li>📅 Add this event to your calendar</li>
                <li>✅ Test your internet connection beforehand</li>
                <li>📝 Prepare any questions you'd like to ask</li>
                <li>🎧 Have a quiet space ready for the session</li>
              </ul>
            </div>

            <center>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/masterclasses/${masterclassId}" class="button">
                View Masterclass Details
              </a>
            </center>

            ${scheduledDateTime ? `
              <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
                🕐 Time until event: <span class="highlight">${Math.floor(hoursUntilEvent)} hours</span>
              </p>
            ` : ''}
            
            <p>If you have any questions, feel free to reach out to us.</p>
            
            <p>Best regards,<br><strong>The Masterclass Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Masterclass Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Masterclass Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Registration Confirmed: ${masterclassTitle}`,
      html: htmlContent,
    });

    // If event is within 2 hours, also send an immediate reminder
    if (needsImmediateReminder && scheduledDateTime) {
      await sendImmediateReminder(
        email,
        userName,
        masterclassTitle,
        speakerName,
        scheduledDateTime,
        masterclassId,
        hoursUntilEvent
      );
    }

    return NextResponse.json({ 
      success: true,
      immediateReminderSent: needsImmediateReminder 
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}

async function sendImmediateReminder(
  email: string,
  userName: string | undefined,
  masterclassTitle: string,
  speakerName: string,
  scheduledDate: Date,
  masterclassId: string,
  hoursUntilEvent: number
) {
  const minutesUntilEvent = Math.floor(hoursUntilEvent * 60);
  const accessLink = `${process.env.NEXT_PUBLIC_BASE_URL}/masterclasses/${masterclassId}/live`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f5f5f5;
        }
        .container {
          background: white;
          margin: 20px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .content {
          padding: 30px;
        }
        .button {
          display: inline-block;
          background: #ef4444;
          color: white !important;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: bold;
          font-size: 18px;
          box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
        }
        .urgent {
          background: #fef2f2;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #ef4444;
          margin: 20px 0;
        }
        .checklist {
          background: #f9fafb;
          padding: 15px 20px;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Starting Very Soon!</h1>
          <p style="font-size: 24px; margin: 10px 0;">⏰ ${minutesUntilEvent} minutes</p>
        </div>
        <div class="content">
          <h2>Hi ${userName || "there"}!</h2>
          <p>Your masterclass is starting in just <strong>${minutesUntilEvent} minutes</strong>! Get ready to join!</p>
          
          <div class="urgent">
            <h3>📚 ${masterclassTitle}</h3>
            <p><strong>Speaker:</strong> ${speakerName}</p>
            <p><strong>⏰ Starting at:</strong> ${scheduledDate.toLocaleTimeString()}</p>
          </div>

          <center>
            <a href="${accessLink}" class="button">
              🔴 JOIN NOW
            </a>
          </center>

          <div class="checklist">
            <p><strong>Quick checklist:</strong></p>
            <ul>
              <li>✅ Stable internet connection</li>
              <li>✅ Notebook ready for notes</li>
              <li>✅ Questions prepared</li>
              <li>✅ Quiet environment</li>
            </ul>
          </div>

          <p style="text-align: center; margin-top: 30px;">See you in a few minutes!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"GrowPro" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🚨 STARTING NOW: ${masterclassTitle}`,
    html: htmlContent,
  });
}

