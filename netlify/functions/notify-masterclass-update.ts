// netlify/functions/notify-masterclass-update.ts
import { Handler } from "@netlify/functions";
import { adminDb } from "../../src/lib/firebaseAdmin";
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass } from "../../src/types/masterclass";

/**
 * This function is triggered from the admin panel to notify
 * all enrolled users about an update to a masterclass.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { masterclassId } = JSON.parse(event.body || "{}");

    if (!masterclassId) {
      return { statusCode: 400, body: "Invalid payload: 'masterclassId' is required." };
    }

    console.log(`🔵 [${new Date().toISOString()}] Received update notification request for masterclass: ${masterclassId}`);

    // 1. Fetch the masterclass document
    const masterclassRef = adminDb.collection("MasterClasses").doc(masterclassId);
    const masterclassSnap = await masterclassRef.get();

    if (!masterclassSnap.exists) {
      console.error(`❌ Masterclass with ID ${masterclassId} not found.`);
      return { statusCode: 404, body: "Masterclass not found." };
    }

    const masterclass = masterclassSnap.data() as Masterclass;
    masterclass.id = masterclassSnap.id;

    // 2. Get the list of enrolled users
    const purchasedUsers = masterclass.purchased_by_users || [];
    if (purchasedUsers.length === 0) {
      console.log(`ℹ️ No users enrolled in "${masterclass.title}". No notifications sent.`);
      return { statusCode: 200, body: "No users are enrolled in this masterclass." };
    }

    console.log(`👥 Found ${purchasedUsers.length} enrolled users for "${masterclass.title}". Fetching emails...`);

    // 3. Fetch user profiles to get their email addresses
    const userDocs = await Promise.all(
      purchasedUsers.map(uid => adminDb.collection("user_profiles").doc(uid).get())
    );

    const recipients = userDocs
      .map(doc => doc.data())
      .filter(ud => ud && ud.email) as { name?: string, email: string }[];

    if (recipients.length === 0) {
      console.log(`ℹ️ No valid email recipients found for masterclass "${masterclass.title}".`);
      return { statusCode: 200, body: "No recipients with valid emails found." };
    }

    console.log(`📧 Sending notifications to ${recipients.length} users.`);

    // 4. Send an email to each enrolled user
    for (const recipient of recipients) {
      const html = generateUpdateEmail(recipient.name || "there", masterclass);
      const subject = `📢 An Update on Your Masterclass: ${masterclass.title}`;
      const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
      
      await sendEmail(recipient.email, encodedSubject, html);
      
      // Add a small delay to avoid hitting email rate limits
      await new Promise(r => setTimeout(r, 700));
    }

    console.log(`✅ [${new Date().toISOString()}] Successfully sent ${recipients.length} update notifications for "${masterclass.title}".`);
    return {
      statusCode: 200,
      body: `Successfully sent ${recipients.length} update notifications.`,
    };

  } catch (err: any) {
    console.error("❌ Error in notify-masterclass-update function:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function generateUpdateEmail(userName: string, masterclass: Masterclass): string {
  return `
    <!DOCTYPE html>
    <html>
    <body>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #333;">📢 Heads up! "${masterclass.title}" has been updated.</h2>
        <p>Hi ${userName},</p>
        <p>Just letting you know that we've made some updates to a masterclass you're enrolled in. New content or changes may have been added.</p>
        <p>Visit the masterclass page to see what's new:</p>
        <a href="${process.env.SITE_URL}/masterclasses/${masterclass.id}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 5px;">
          View Masterclass
        </a>
        <p style="margin-top: 20px; font-size: 0.9em; color: #777;">Happy learning!</p>
      </div>
    </body>
    </html>
  `;
}