// // src/utils/gmailHelper.ts
// import { google } from 'googleapis';

// const oauth2Client = new google.auth.OAuth2(
//   process.env.GMAIL_CLIENT_ID,
//   process.env.GMAIL_CLIENT_SECRET,
//   process.env.GMAIL_REDIRECT_URI
// );

// // Set credentials with refresh token
// oauth2Client.setCredentials({
//   refresh_token: process.env.GMAIL_REFRESH_TOKEN,
// });

// const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// function createEmailMessage(to: string, subject: string, html: string, from?: string) {
//   const fromEmail = from || process.env.GMAIL_FROM_EMAIL || 'your-email@gmail.com';
  
//   const emailLines = [
//     `From: ${fromEmail}`,
//     `To: ${to}`,
//     `Subject: ${subject}`,
//     'MIME-Version: 1.0',
//     'Content-Type: text/html; charset=utf-8',
//     '',
//     html,
//   ];

//   const email = emailLines.join('\r\n');
//   const encodedEmail = Buffer.from(email)
//     .toString('base64')
//     .replace(/\+/g, '-')
//     .replace(/\//g, '_')
//     .replace(/=+$/, '');

//   return encodedEmail;
// }

// export async function sendEmail(to: string, subject: string, html: string) {
//   try {
//     const raw = createEmailMessage(to, subject, html);

//     const response = await gmail.users.messages.send({
//       userId: 'me',
//       requestBody: {
//         raw,
//       },
//     });

//     return {
//       success: true,
//       messageId: response.data.id,
//     };
//   } catch (error: any) {
//     console.error('Gmail API error:', error);
//     throw new Error(`Email send failed: ${error.message}`);
//   }
// }

// export async function sendBulkEmails(
//   emails: Array<{ to: string; subject: string; html: string }>
// ) {
//   const results = [];
  
//   for (const email of emails) {
//     try {
//       const result = await sendEmail(email.to, email.subject, email.html);
//       results.push({ ...email, success: true, messageId: result.messageId });
      
//       // Delay to avoid rate limiting (Gmail allows ~100 emails/day for free accounts)
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     } catch (error: any) {
//       results.push({ ...email, success: false, error: error.message });
//     }
//   }
  
//   return results;
// }


// src/utils/gmailHelper.ts
import { google } from 'googleapis';

const CLIENT_ID = process.env.GMAIL_CLIENT_ID!;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI!;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN!;
const FROM_EMAIL = process.env.GMAIL_FROM_EMAIL || "your-email@gmail.com";

// OAuth client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

// Gmail instance
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/* ------------------------------------------------------
   Create Raw Gmail Email (Base64URL encoded)
------------------------------------------------------ */
function createEmailMessage(to: string, subject: string, html: string, from?: string) {
  const fromEmail = from || FROM_EMAIL;

  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ];

  const email = emailLines.join("\r\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return encodedEmail;
}

/* ------------------------------------------------------
   SEND SINGLE EMAIL (WITH FULL DEBUG LOGS)
------------------------------------------------------ */
export async function sendEmail(to: string, subject: string, html: string) {
  console.log("📧 Gmail SEND START");
  console.log("➡️ To:", to);
  console.log("➡️ Subject:", subject);

  // Debug: check envs
  console.log("🔐 ENV CHECK:", {
    CLIENT_ID: !!CLIENT_ID,
    CLIENT_SECRET: !!CLIENT_SECRET,
    REDIRECT_URI: !!REDIRECT_URI,
    REFRESH_TOKEN: REFRESH_TOKEN.substring(0, 10) + "...",
    FROM_EMAIL,
  });

  try {
    console.log("🔑 Requesting new access token...");
    const accessToken = await oauth2Client.getAccessToken();
    console.log("🟢 Access Token acquired:", accessToken?.token?.substring(0, 20) + "...");

    const rawEmail = createEmailMessage(to, subject, html);

    console.log("📨 Raw Email Size:", rawEmail.length, "characters");

    console.log("🚀 Sending email using Gmail API...");
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawEmail },
    });

    console.log("✅ GMAIL SEND SUCCESS");
    console.log("📬 Gmail Response ID:", response.data.id);

    return {
      success: true,
      messageId: response.data.id,
    };

  } catch (error: any) {
    console.log("❌ GMAIL API ERROR OCCURRED");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Full Error:", error);

    throw new Error(`Email send failed: ${error.message}`);
  }
}

/* ------------------------------------------------------
  BULK EMAILS (KEPT SAME, WITH LOGGING)
------------------------------------------------------ */
export async function sendBulkEmails(
  emails: Array<{ to: string; subject: string; html: string }>
) {
  console.log("📦 Starting Bulk Email Process:", emails.length, "emails");

  const results = [];

  for (const email of emails) {
    try {
      console.log("📤 Sending to:", email.to);
      const result = await sendEmail(email.to, email.subject, email.html);

      results.push({ ...email, success: true, messageId: result.messageId });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.log("❌ Bulk Email Error:", error.message);
      results.push({ ...email, success: false, error: error.message });
    }
  }

  return results;
}
