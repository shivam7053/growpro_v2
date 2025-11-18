// app/api/cron/send-reminders/route.ts
// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Schedule: Run every hour to check for upcoming masterclasses

import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

    // Get all upcoming masterclasses
    const masterclassesRef = collection(db, "MasterClasses");
    const snapshot = await getDocs(masterclassesRef);

    const emailsSent = {
      reminder24h: 0,
      reminder30min: 0,
      errors: 0,
    };

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      if (data.type !== "upcoming" || !data.scheduled_date) continue;
      
      const scheduledDate = new Date(data.scheduled_date);
      const timeDiff = scheduledDate.getTime() - now.getTime();
      
      // Check if we should send 24-hour reminder
      const shouldSend24h = timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
      
      // Check if we should send 30-minute reminder
      const shouldSend30min = timeDiff > 0 && timeDiff <= 30 * 60 * 1000;

      if (!shouldSend24h && !shouldSend30min) continue;

      // Get registered users
      const joinedUsers = data.joined_users || [];
      
      for (const userId of joinedUsers) {
        try {
          // Get user email
          const userDoc = await getDoc(doc(db, "users", userId));
          if (!userDoc.exists()) continue;
          
          const userData = userDoc.data();
          const userEmail = userData.email;
          
          if (!userEmail) continue;

          // Send appropriate reminder
          if (shouldSend24h) {
            await send24HourReminder(userEmail, data, docSnap.id);
            emailsSent.reminder24h++;
          } else if (shouldSend30min) {
            await send30MinuteReminder(userEmail, data, docSnap.id);
            emailsSent.reminder30min++;
          }
        } catch (error) {
          console.error(`Error sending email to user ${userId}:`, error);
          emailsSent.errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    );
  }
}

async function send24HourReminder(
  email: string,
  masterclass: any,
  masterclassId: string
) {
  const scheduledDate = new Date(masterclass.scheduled_date);
  const formattedDate = scheduledDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .highlight { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⏰ Reminder: Masterclass Tomorrow!</h1>
      </div>
      <div class="content">
        <h2>Hi there!</h2>
        <p>This is a friendly reminder that your registered masterclass is starting in <strong>24 hours</strong>!</p>
        
        <div class="highlight">
          <h3>📚 ${masterclass.title}</h3>
          <p><strong>Speaker:</strong> ${masterclass.speaker_name}</p>
          <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
        </div>

        <p><strong>What to do now:</strong></p>
        <ul>
          <li>📅 Add to calendar if you haven't already</li>
          <li>📝 Prepare any questions you'd like to ask</li>
          <li>🔔 Enable notifications to get the access link</li>
          <li>☕ Set a reminder 30 minutes before</li>
        </ul>

        <center>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/masterclasses/${masterclassId}" class="button">
            View Details
          </a>
        </center>

        <p>See you tomorrow!</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Masterclass Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reminder: ${masterclass.title} - Tomorrow!`,
    html: htmlContent,
  });
}

async function send30MinuteReminder(
  email: string,
  masterclass: any,
  masterclassId: string
) {
  const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/masterclasses/${masterclassId}/live`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-size: 18px; font-weight: bold; }
        .urgent { background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Starting in 30 Minutes!</h1>
      </div>
      <div class="content">
        <h2>Hi there!</h2>
        <p>Your masterclass is starting in just <strong>30 minutes</strong>! Get ready to join!</p>
        
        <div class="urgent">
          <h3>📚 ${masterclass.title}</h3>
          <p><strong>Speaker:</strong> ${masterclass.speaker_name}</p>
          <p><strong>⏰ Starting Soon!</strong></p>
        </div>

        <center>
          <a href="${accessLink}" class="button">
            🔴 JOIN NOW
          </a>
        </center>

        <p><strong>Quick checklist:</strong></p>
        <ul>
          <li>✅ Stable internet connection</li>
          <li>✅ Notebook for taking notes</li>
          <li>✅ Questions prepared</li>
        </ul>

        <p>See you in a few minutes!</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Masterclass Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🚨 STARTING NOW: ${masterclass.title}`,
    html: htmlContent,
  });
}