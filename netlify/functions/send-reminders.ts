// netlify/functions/send-reminders.ts
// Scheduled function - runs every hour
// Schedule: 0 * * * * (every hour at minute 0)
// Free tier: Resend allows 3,000 emails/month, 100 emails/day

import { Handler } from "@netlify/functions";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../src/lib/firebase";

// Using Resend (free tier: 3,000 emails/month)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev"; // Use your verified domain

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }

  return response.json();
}

export const handler: Handler = async (event, context) => {
  // For scheduled functions, Netlify doesn't send special headers
  // The function will be triggered automatically by the schedule
  
  try {
    const now = new Date();
    
    // Define time windows for reminders
    const in24HoursStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24HoursEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    const in2HoursStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
    const in2HoursEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const masterclassesRef = collection(db, "MasterClasses");
    const snapshot = await getDocs(masterclassesRef);

    const emailsSent = {
      reminder24h: 0,
      reminder2h: 0,
      errors: 0,
      skipped: 0,
    };

    const processedClasses: string[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const masterclassId = docSnap.id;
      
      if (data.type !== "upcoming" || !data.scheduled_date) {
        continue;
      }
      
      const scheduledDate = new Date(data.scheduled_date);
      
      if (scheduledDate < now) {
        console.log(`Skipping past event: ${data.title}`);
        continue;
      }

      const remindersSent = data.remindersSent || {};
      
      const shouldSend24h = 
        scheduledDate >= in24HoursStart && 
        scheduledDate <= in24HoursEnd &&
        !remindersSent['24h'];
      
      const shouldSend2h = 
        scheduledDate >= in2HoursStart && 
        scheduledDate <= in2HoursEnd &&
        !remindersSent['2h'];

      if (!shouldSend24h && !shouldSend2h) {
        continue;
      }

      const joinedUsers = data.joined_users || [];
      
      if (joinedUsers.length === 0) {
        console.log(`No registered users for: ${data.title}`);
        continue;
      }

      console.log(`Processing ${data.title} - ${joinedUsers.length} users`);
      processedClasses.push(data.title);

      let successCount = 0;
      
      for (const userId of joinedUsers) {
        try {
          const userDoc = await getDoc(doc(db, "user_profiles", userId));
          if (!userDoc.exists()) {
            console.log(`User not found: ${userId}`);
            emailsSent.skipped++;
            continue;
          }
          
          const userData = userDoc.data();
          const userEmail = userData.email;
          const userName = userData.name || userData.displayName || "";
          
          if (!userEmail) {
            console.log(`No email for user: ${userId}`);
            emailsSent.skipped++;
            continue;
          }

          if (shouldSend24h) {
            await send24HourReminder(userEmail, userName, data, masterclassId);
            successCount++;
            emailsSent.reminder24h++;
            console.log(`✅ 24h reminder sent to: ${userEmail}`);
          } else if (shouldSend2h) {
            await send2HourReminder(userEmail, userName, data, masterclassId);
            successCount++;
            emailsSent.reminder2h++;
            console.log(`✅ 2h reminder sent to: ${userEmail}`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error sending email to user ${userId}:`, error);
          emailsSent.errors++;
        }
      }

      if (successCount > 0) {
        try {
          const updateData: any = {};
          if (shouldSend24h) {
            updateData['remindersSent.24h'] = true;
            updateData['remindersSent.24h_timestamp'] = new Date().toISOString();
          }
          if (shouldSend2h) {
            updateData['remindersSent.2h'] = true;
            updateData['remindersSent.2h_timestamp'] = new Date().toISOString();
          }
          
          await updateDoc(doc(db, "MasterClasses", masterclassId), updateData);
          console.log(`✅ Updated reminder tracking for: ${data.title}`);
        } catch (error) {
          console.error(`Error updating reminder tracking:`, error);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ...emailsSent,
        processedClasses,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("Cron job error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: String(error) }),
    };
  }
};

async function send24HourReminder(
  email: string,
  userName: string,
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
    timeZoneName: "short",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); 
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
        .highlight { 
          background: #fef3c7; 
          padding: 20px; 
          border-radius: 8px; 
          border-left: 4px solid #f59e0b; 
          margin: 20px 0;
        }
        .highlight h3 {
          margin-top: 0;
          color: #92400e;
        }
        .checklist {
          background: #f0fdf4;
          padding: 15px 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .checklist ul {
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Reminder: Tomorrow!</h1>
          <p style="font-size: 20px; margin: 10px 0;">Your masterclass is in 24 hours</p>
        </div>
        <div class="content">
          <h2>Hi ${userName || "there"}!</h2>
          <p>This is a friendly reminder that your registered masterclass is starting <strong>tomorrow</strong>!</p>
          
          <div class="highlight">
            <h3>📚 ${masterclass.title}</h3>
            <p><strong>Speaker:</strong> ${masterclass.speaker_name}</p>
            <p><strong>📅 Date & Time:</strong> ${formattedDate}</p>
          </div>

          <div class="checklist">
            <p><strong>📝 What to do now:</strong></p>
            <ul>
              <li>📅 Add to your calendar if you haven't already</li>
              <li>📝 Prepare any questions you'd like to ask</li>
              <li>🔔 Enable notifications to get the join link</li>
              <li>☕ Set a reminder for 2 hours before</li>
              <li>✅ Test your internet connection</li>
            </ul>
          </div>

          <center>
            <a href="${process.env.SITE_URL}/masterclasses/${masterclassId}" class="button">
              View Event Details
            </a>
          </center>

          <p style="text-align: center; margin-top: 30px; color: #6b7280;">
            💡 You'll receive another reminder 2 hours before the event starts with the join link.
          </p>
          
          <p>See you tomorrow!</p>
          <p>Best regards,<br><strong>The Masterclass Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated reminder. You registered for this event.</p>
          <p>&copy; ${new Date().getFullYear()} Masterclass Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(
    email,
    `⏰ Tomorrow: ${masterclass.title}`,
    htmlContent
  );
}

async function send2HourReminder(
  email: string,
  userName: string,
  masterclass: any,
  masterclassId: string
) {
  const scheduledDate = new Date(masterclass.scheduled_date);
  const accessLink = `${process.env.SITE_URL}/masterclasses/${masterclassId}/live`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
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
        .header h1 {
          margin: 0;
          font-size: 28px;
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
        .urgent h3 {
          margin-top: 0;
          color: #dc2626;
        }
        .checklist {
          background: #f9fafb;
          padding: 15px 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px;
          background: #f9fafb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Starting in 2 Hours!</h1>
          <p style="font-size: 20px; margin: 10px 0;">Get Ready to Join</p>
        </div>
        <div class="content">
          <h2>Hi ${userName || "there"}!</h2>
          <p>Your masterclass is starting in just <strong>2 hours</strong>! It's time to get ready.</p>
          
          <div class="urgent">
            <h3>📚 ${masterclass.title}</h3>
            <p><strong>Speaker:</strong> ${masterclass.speaker_name}</p>
            <p><strong>⏰ Starting at:</strong> ${scheduledDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}</p>
          </div>

          <center>
            <a href="${accessLink}" class="button">
              🔴 JOIN THE MASTERCLASS
            </a>
          </center>

          <div class="checklist">
            <p><strong>✅ Quick Checklist:</strong></p>
            <ul>
              <li>✅ Stable internet connection</li>
              <li>✅ Notebook ready for taking notes</li>
              <li>✅ Questions prepared to ask</li>
              <li>✅ Quiet environment secured</li>
              <li>✅ Notifications enabled</li>
            </ul>
          </div>

          <p style="text-align: center; background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            💡 <strong>Pro Tip:</strong> Join 5 minutes early to test your connection and get settled!
          </p>

          <p style="text-align: center; margin-top: 30px;">See you in 2 hours!</p>
          <p>Best regards,<br><strong>The Masterclass Team</strong></p>
        </div>
        <div class="footer">
          <p>Having trouble joining? Contact us at support@example.com</p>
          <p>&copy; ${new Date().getFullYear()} Masterclass Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(
    email,
    `🚨 STARTING IN 2 HOURS: ${masterclass.title}`,
    htmlContent
  );
}

// Schedule to run every hour
export const handler = schedule("0 * * * *", handler);