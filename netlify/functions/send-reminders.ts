// netlify/functions/send-reminders.ts
import { Handler } from "@netlify/functions";
import { adminDb } from "../../src/lib/firebaseAdmin";
import { sendEmail } from "../../src/utils/gmailHelper";

const CRON_SECRET = process.env.CRON_SECRET_KEY;

const handler: Handler = async (event) => {
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

    const in24HoursStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const in24HoursEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const in2HoursStart = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);
    const in2HoursEnd = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    const snapshot = await adminDb.collection("MasterClasses").get();

    const emailsSent: any = {
      reminder24h: 0,
      reminder2h: 0,
      errors: 0,
      skipped: 0,
    };

    const processedClasses: string[] = [];

    // ------------------------------
    // 2️⃣ Loop over masterclasses
    // ------------------------------
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const masterclassId = docSnap.id;

      if (data.type !== "upcoming" || !data.scheduled_date) continue;

      const scheduledDate = new Date(data.scheduled_date);
      if (scheduledDate < now) continue;

      const remindersSent = data.remindersSent || {};

      const shouldSend24h =
        scheduledDate >= in24HoursStart &&
        scheduledDate <= in24HoursEnd &&
        !remindersSent["24h"];

      const shouldSend2h =
        scheduledDate >= in2HoursStart &&
        scheduledDate <= in2HoursEnd &&
        !remindersSent["2h"];

      if (!shouldSend24h && !shouldSend2h) continue;

      const joinedUsers = data.joined_users || [];
      if (joinedUsers.length === 0) continue;

      processedClasses.push(data.title);

      console.log(`📌 Processing ${data.title} (${joinedUsers.length} users)`);

      let sentCounter = 0;

      // ------------------------------
      // 3️⃣ Loop through users
      // ------------------------------
      for (const userId of joinedUsers) {
        try {
          const userDoc = await adminDb
            .collection("user_profiles")
            .doc(userId)
            .get();

          if (!userDoc.exists) {
            emailsSent.skipped++;
            continue;
          }

          const userData = userDoc.data()!;
          const userEmail = userData.email;
          const userName = userData.name || "there";

          if (!userEmail) {
            emailsSent.skipped++;
            continue;
          }

          if (shouldSend24h) {
            await send24HourReminder(userEmail, userName, data, masterclassId);
            emailsSent.reminder24h++;
            sentCounter++;
          } else if (shouldSend2h) {
            await send2HourReminder(userEmail, userName, data, masterclassId);
            emailsSent.reminder2h++;
            sentCounter++;
          }

          // Gmail Rate Limit Protection
          await new Promise((r) => setTimeout(r, 700));
        } catch (err) {
          console.error("Email error:", err);
          emailsSent.errors++;
        }
      }

      // ------------------------------
      // 4️⃣ Update Reminder Status in Firestore
      // ------------------------------
      if (sentCounter > 0) {
        const updateData: any = {};
        if (shouldSend24h) {
          updateData["remindersSent.24h"] = true;
          updateData["remindersSent.24h_timestamp"] = new Date().toISOString();
        }
        if (shouldSend2h) {
          updateData["remindersSent.2h"] = true;
          updateData["remindersSent.2h_timestamp"] = new Date().toISOString();
        }

        await adminDb.collection("MasterClasses").doc(masterclassId).update(updateData);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        processedClasses,
        ...emailsSent,
      }),
    };
  } catch (err) {
    console.error("Cron Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: String(err) }),
    };
  }
};

// ------------------------------
// 5️⃣ Email Templates
// ------------------------------
async function send24HourReminder(
  email: string,
  userName: string,
  masterclass: any,
  masterclassId: string
) {
  const scheduledDate = new Date(masterclass.scheduled_date);

  const html = `
    <h2>⏰ Reminder: Your Masterclass is Tomorrow!</h2>
    <p>Hi ${userName},</p>
    <p>Your session "<b>${masterclass.title}</b>" starts tomorrow at:</p>
    <p><b>${scheduledDate.toLocaleString()}</b></p>
    <a href="${process.env.SITE_URL}/masterclasses/${masterclassId}">
      View Event Details
    </a>
  `;

  await sendEmail(email, `⏰ Tomorrow: ${masterclass.title}`, html);
}

async function send2HourReminder(
  email: string,
  userName: string,
  masterclass: any,
  masterclassId: string
) {
  const accessLink = `${process.env.SITE_URL}/masterclasses/${masterclassId}/live`;

  const html = `
    <h2>🚨 Your Masterclass Starts in 2 Hours!</h2>
    <p>Hi ${userName},</p>
    <p>Get ready! "<b>${masterclass.title}</b>" goes live soon.</p>
    <a href="${accessLink}">Join Now</a>
  `;

  await sendEmail(email, `🚨 2 Hours Left: ${masterclass.title}`, html);
}

export { handler };
