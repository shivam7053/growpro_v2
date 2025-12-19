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

interface Attachment {
  filename: string;
  content: string;
  encoding: string;
  contentType: string;
}

/* ------------------------------------------------------
   Create Raw Gmail Email with Optional Attachments (Base64URL encoded)
------------------------------------------------------ */
function createEmailMessage(
  to: string, 
  subject: string, 
  html: string, 
  from?: string,
  attachments?: Attachment[]
) {
  const fromEmail = from || FROM_EMAIL;
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  let emailLines: string[];

  if (attachments && attachments.length > 0) {
    // Email with attachments (multipart)
    emailLines = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      html,
      ""
    ];

    // Add each attachment
    for (const attachment of attachments) {
      emailLines.push(`--${boundary}`);
      emailLines.push(`Content-Type: ${attachment.contentType}; name="${attachment.filename}"`);
      emailLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      emailLines.push(`Content-Transfer-Encoding: ${attachment.encoding}`);
      emailLines.push("");
      emailLines.push(attachment.content);
      emailLines.push("");
    }

    // Close boundary
    emailLines.push(`--${boundary}--`);
  } else {
    // Simple email without attachments
    emailLines = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      html,
    ];
  }

  const email = emailLines.join("\r\n");

  const encodedEmail = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return encodedEmail;
}

/* ------------------------------------------------------
   SEND SINGLE EMAIL (WITH FULL DEBUG LOGS + ATTACHMENT SUPPORT)
------------------------------------------------------ */
export async function sendEmail(
  to: string, 
  subject: string, 
  html: string,
  attachments?: Attachment[]
) {
  console.log("📧 Gmail SEND START");
  console.log("➡️ To:", to);
  console.log("➡️ Subject:", subject);
  console.log("📎 Attachments:", attachments?.length || 0);

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

    const rawEmail = createEmailMessage(to, subject, html, FROM_EMAIL, attachments);

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
  BULK EMAILS (WITH ATTACHMENT SUPPORT)
------------------------------------------------------ */
export async function sendBulkEmails(
  emails: Array<{ 
    to: string; 
    subject: string; 
    html: string;
    attachments?: Attachment[];
  }>
) {
  console.log("📦 Starting Bulk Email Process:", emails.length, "emails");

  const results = [];

  for (const email of emails) {
    try {
      console.log("📤 Sending to:", email.to);
      const result = await sendEmail(
        email.to, 
        email.subject, 
        email.html,
        email.attachments
      );

      results.push({ ...email, success: true, messageId: result.messageId });

      // Rate limiting: wait 1 second between emails
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      console.log("❌ Bulk Email Error:", error.message);
      results.push({ ...email, success: false, error: error.message });
    }
  }

  return results;
}