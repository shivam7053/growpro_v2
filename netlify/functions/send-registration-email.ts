// netlify/functions/send-registration-email.ts
import { Handler } from "@netlify/functions";
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass } from "../../src/types/masterclass"; // Import Masterclass type

export const handler: Handler = async (event, context) => {
  console.log("📩 send-registration-email invoked");

  if (event.httpMethod !== "POST") {
    console.warn("❌ Invalid method:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let bodyData: any = {};
  try {
    bodyData = JSON.parse(event.body || "{}");
  } catch (err) {
    console.error("❌ JSON PARSE ERROR:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  console.log("🟢 Incoming payload:", bodyData);

  const { email, userName, masterclass } = bodyData as { email: string, userName: string, masterclass: Masterclass };

  if (!email) return errorResponse("Missing: email");
  if (!masterclass || !masterclass.id || !masterclass.title) return errorResponse("Missing or invalid: masterclass object");

  const requiredEnv = [
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REDIRECT_URI",
    "GMAIL_REFRESH_TOKEN",
    "SENDER_EMAIL",
    "SITE_URL"
  ];
  
  for (const key of requiredEnv) {
    if (!process.env[key]) {
      console.error(`❌ Missing ENV: ${key}`);
      return errorResponse(`Server missing configuration: ${key}`);
    }
  }

  const scheduledDateTime = scheduledDate ? new Date(scheduledDate) : null;
  const now = new Date();

  let hoursUntilEvent = null;

  if (scheduledDateTime) {
    hoursUntilEvent = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  const needsImmediateReminder = hoursUntilEvent !== null && hoursUntilEvent <= 2;

  console.log("📅 Event time:", { scheduledDateTime, hoursUntilEvent });

  const htmlContent = `<html><body><h1>Registration Confirmed</h1></body></html>`;

  console.log("📧 Sending confirmation email…");
  try {
    const start = Date.now();
    await sendEmail(
      email,
      `Registration Confirmed: ${masterclassTitle}`,
      htmlContent
    );
    console.log(`✅ Email sent successfully in ${Date.now() - start} ms`);
  } catch (err: any) {
    console.error("❌ GMAIL SEND ERROR DETAILS:");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("Full Error Object:", err);

    // FIXED DEBUGGING
    console.log("📨 Gmail API request payload:", {
      from: process.env.SENDER_EMAIL,
      to: email,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to send confirmation email",
        details: err.message,
      }),
    };
  }

  if (needsImmediateReminder) {
    console.log("⚠️ Sending immediate reminder...");
    try {
      await sendEmail(
        email,
        `Starting Soon: ${masterclassTitle}`,
        "<h1>Reminder: starting soon!</h1>"
      );
      console.log("✅ Immediate reminder sent");
    } catch (err) {
      console.error("❌ Reminder email error:", err);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      sentImmediateReminder: needsImmediateReminder,
    }),
  };
};

function errorResponse(msg: string) {
  console.warn("⚠️ Validation error:", msg);
  return {
    statusCode: 400,
    body: JSON.stringify({ error: msg }),
  };
}
