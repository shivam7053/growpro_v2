// netlify/functions/send-reminders.ts
import { Handler } from "@netlify/functions";
import { adminDb } from "../../src/lib/firebaseAdmin";
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass, MasterclassContent } from "../../src/types/masterclass";

const CRON_SECRET = process.env.CRON_SECRET_KEY;

export const handler: Handler = async (event) => {
  // ------------------------------
  // 1️⃣ Auth Check for Cron Job
  // ------------------------------
  const authHeader =
    event.headers["x-cron-secret"] || event.headers["authorization"];

  if (authHeader !== CRON_SECRET) {
    console.error("❌ Unauthorized cron attempt");
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  console.log("🔐 Cron Job Authenticated");

  try {
    const now = new Date();

    // Define the 12-hour window (e.g., 11.5 to 12.5 hours from now)
    const in12HoursStart = new Date(now.getTime() + 11.5 * 60 * 60 * 1000);
    const in12HoursEnd = new Date(now.getTime() + 12.5 * 60 * 60 * 1000);

    const snapshot = await adminDb.collection("MasterClasses").get();

    const summary = {
      remindersSent: 0,
      errors: 0,
      skipped: 0,
    };

    const processedContent: string[] = [];

    // ------------------------------
    // 2️⃣ Loop over masterclasses
    // ------------------------------
    for (const docSnap of snapshot.docs) {
      const masterclass = docSnap.data() as Masterclass;
      const masterclassId = docSnap.id;

      if (!masterclass.content || masterclass.content.length === 0) continue;

      // Loop through each piece of content in the masterclass
      for (const contentItem of masterclass.content) {
        if (contentItem.source !== 'zoom' || !contentItem.scheduled_date) continue;

        const scheduledDate = new Date(contentItem.scheduled_date);
        if (scheduledDate < now) continue;

        const remindersSent = masterclass.remindersSent || {};
        const reminderKey = `${contentItem.id}_12h`;

        // Check if the session is in the 12-hour window and reminder hasn't been sent
        const shouldSendReminder =
          scheduledDate >= in12HoursStart &&
          scheduledDate <= in12HoursEnd &&
          !remindersSent[reminderKey];

        if (!shouldSendReminder) continue;

        const purchasedUsers = masterclass.purchased_by_users || [];
        if (purchasedUsers.length === 0) continue;

        processedContent.push(`${masterclass.title} - ${contentItem.title}`);
        console.log(`📌 Processing reminder for "${contentItem.title}" (${purchasedUsers.length} users)`);

        let sentCounter = 0;

        // ------------------------------
        // 3️⃣ Loop through purchased users
        // ------------------------------
        for (const userId of purchasedUsers) {
          try {
            const userDoc = await adminDb.collection("user_profiles").doc(userId).get();
            if (!userDoc.exists) {
              summary.skipped++;
              continue;
            }

            const userData = userDoc.data()!;
            if (!userData.email) {
              summary.skipped++;
              continue;
            }

            await send12HourReminder(userData.email, userData.name || "there", masterclass, contentItem);
            summary.remindersSent++;
            sentCounter++;

            // Gmail Rate Limit Protection
            await new Promise((r) => setTimeout(r, 700));
          } catch (err) {
            console.error(`❌ Email error for user ${userId}:`, err);
            summary.errors++;
          }
        }

        // ------------------------------
        // 4️⃣ Update Reminder Status in Firestore
        // ------------------------------
        if (sentCounter > 0) {
          const updateData = { [`remindersSent.${reminderKey}`]: true };
          await adminDb.collection("MasterClasses").doc(masterclassId).update(updateData);
          console.log(`✅ Marked reminder as sent for "${contentItem.title}"`);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedContent,
        ...summary,
      }),
    };
  } catch (err) {
    console.error("❌ Cron Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: String(err) }),
    };
  }
};

// ------------------------------
// 5️⃣ Email Templates
// ------------------------------
async function send12HourReminder(
  email: string,
  userName: string,
  masterclass: Masterclass,
  contentItem: MasterclassContent
) {
  const scheduledDate = new Date(contentItem.scheduled_date!);

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">⏰ Reminder: Your Live Session Starts in 12 Hours!</h2>
        <p>Hi ${userName},</p>
        <p>This is a reminder that your live session, "<b>${contentItem.title}</b>", as part of the "<b>${masterclass.title}</b>" masterclass, is scheduled to begin in approximately 12 hours.</p>
        <p><b>Scheduled Time:</b> ${scheduledDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
        <p>You can access the session details and join link directly from the masterclass page:</p>
        <a href="${process.env.SITE_URL}/masterclasses/${masterclass.id}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px;">
          Go to Masterclass
        </a>
        <p style="margin-top: 20px; font-size: 0.9em; color: #777;">We're excited to see you there!</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, `⏰ Reminder: "${contentItem.title}" starts in 12 hours`, html);
}
