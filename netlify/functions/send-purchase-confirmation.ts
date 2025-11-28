// netlify/functions/send-purchase-confirmation.ts
import { Handler } from "@netlify/functions";
import { sendEmail } from "../../src/utils/gmailHelper";
import { Masterclass } from "../../src/types/masterclass"; // Import Masterclass type

export const handler: Handler = async (event, context) => {
  console.log(`📩 [${new Date().toISOString()}] send-purchase-confirmation invoked.`);

  if (event.httpMethod !== "POST") {
    console.warn("❌ Invalid method:", event.httpMethod);
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let bodyData: any = {};
  try {
    bodyData = JSON.parse(event.body || "{}");
  } catch (err) {
    console.error(`❌ [${new Date().toISOString()}] JSON PARSE ERROR: Could not parse event body. Raw body: ${event.body}`, err);
    // --- ✅ NEW: More specific error for bad JSON ---
    console.error("❌ JSON PARSE ERROR:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }
  console.log(`🟢 [${new Date().toISOString()}] Received raw bodyData:`, JSON.stringify(bodyData, null, 2));

  console.log("🟢 Validating incoming payload...");

  // --- ✅ NEW: Robust Environment Variable Check ---
  const requiredEnv = [
    "GMAIL_CLIENT_ID",
    "GMAIL_CLIENT_SECRET",
    "GMAIL_REDIRECT_URI",
    "GMAIL_REFRESH_TOKEN",
    "SENDER_EMAIL",
    "SITE_URL",
  ];

  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    const errorMsg = `[${new Date().toISOString()}] Server configuration error: The following required environment variables are missing: ${missingEnv.join(", ")}. Please add them in the Netlify UI.`;
    console.error(`❌ ${errorMsg}`);
    return { statusCode: 500, body: JSON.stringify({ error: errorMsg }) };
  }
  console.log(`✅ [${new Date().toISOString()}] All required environment variables are present.`);

  const { email, userName, masterclass, userId } = bodyData as { email: string, userName: string, masterclass: Masterclass, userId: string };
  console.log(`🔍 [${new Date().toISOString()}] Extracted payload: Email=${email}, UserName=${userName}, MasterclassId=${masterclass?.id}, UserId=${userId}`);

  // --- ✅ NEW: More granular payload validation ---
  if (!email) return errorResponse(`[${new Date().toISOString()}] Missing: email in payload.`);
  if (!masterclass) return errorResponse(`[${new Date().toISOString()}] Missing: masterclass object in payload.`);
  if (!masterclass.id) return errorResponse(`[${new Date().toISOString()}] Missing: masterclass.id in payload.`);
  if (!masterclass.title) return errorResponse(`[${new Date().toISOString()}] Missing: masterclass.title in payload.`);
  if (!userId) return errorResponse(`[${new Date().toISOString()}] Missing: userId from payload.`);
  console.log(`✅ [${new Date().toISOString()}] Payload contains valid email, masterclass details, and userId: ${userId}.`);

  // --- ✅ NEW: Data Integrity Validation ---
  // Verify that the user receiving the email is actually in the purchaser list.
  // This prevents sending emails for failed or incomplete transactions.
  if (userId && !masterclass.purchased_by_users?.includes(userId)) {
    const errorMsg = `Data integrity check failed: User ${userId} is not in the purchaser list for masterclass ${masterclass.id}. Aborting email.`;
    console.error(`❌ ${errorMsg}`);
    return { statusCode: 403, body: JSON.stringify({ error: errorMsg }) }; // Changed to 403 Forbidden for access issue
  }
  console.log(`✅ [${new Date().toISOString()}] Data integrity check passed: User ${userId} is a valid purchaser for masterclass ${masterclass.id}.`);

  // --- ✅ NEW: Generate dynamic HTML content from masterclass details ---
  const generateContentList = () => {
    console.log(`📄 [${new Date().toISOString()}] Starting to generate email content list.`);
    if (!masterclass.content || masterclass.content.length === 0) {
      // --- ✅ NEW: Warning for empty content ---
      console.warn(`⚠️ Masterclass "${masterclass.title}" has no content items. Email will show a 'coming soon' message.`);
      return "<p>Content details will be updated soon.</p>";
    }

    console.log(`📄 Generating email content list with ${masterclass.content.length} items.`);
    console.log(`🔗 [${new Date().toISOString()}] Using SITE_URL for links: ${process.env.SITE_URL}`);
    return masterclass.content.map(item => {
      const isZoom = item.source === 'zoom';
      const link = isZoom ? (item.zoom_link || `https://zoom.us/j/${item.zoom_meeting_id}`) : item.youtube_url;
      const linkText = isZoom ? "Join Session" : "Watch Video";

      const zoomDetails = isZoom && item.scheduled_date ? `
        <div style="margin-top: 10px; padding-left: 15px; border-left: 2px solid #e5e7eb; font-size: 14px; color: #4b5563;">
          <strong>Scheduled for:</strong> ${new Date(item.scheduled_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}<br>
          <strong>Meeting ID:</strong> ${item.zoom_meeting_id || 'N/A'}<br>
          ${item.zoom_passcode ? `<strong>Passcode:</strong> ${item.zoom_passcode}` : ''}
        </div>
      ` : '';

      return `
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
          <p style="margin: 0; font-weight: 600; color: #1f2937;">${item.order + 1}. ${item.title}</p>
          <p style="margin: 5px 0 12px; font-size: 14px; color: #6b7280;">Source: ${isZoom ? 'Live Zoom Session' : 'YouTube Video'}</p>
          <a href="${link}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
            ${linkText}
          </a>
          ${zoomDetails}
        </div>
      `;
    }).join('');
  };

  // ✅ NEW: Generate HTML for the optional demo video
  const generateDemoVideoSection = () => {
    if (!masterclass.demo_video_url) {
      return ''; // Return empty string if no demo video
    }
    console.log(`📹 [${new Date().toISOString()}] Found demo video. Generating section.`);
    return `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #fefce8; border: 1px solid #fde047; border-radius: 8px;">
        <p style="margin: 0; font-weight: 600; color: #a16207;">⭐ Watch the Welcome Video</p>
        <a href="${masterclass.demo_video_url}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background-color: #ca8a04; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Watch Now
        </a>
      </div>
    `;
  };
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Confirmation</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #4f46e5; color: #ffffff; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Thank You for Your Purchase!</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${userName || 'there'},</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5;">
            You have successfully enrolled in the masterclass. You now have full access to all the content listed below.
          </p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h2 style="margin: 0 0 5px; font-size: 20px; color: #11182c;">${masterclass.title}</h2>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">by ${masterclass.speaker_name}</p>
          </div>
          
          <h3 style="font-size: 18px; color: #11182c; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 20px;">
            Your Course Content
          </h3>
          
          ${generateDemoVideoSection()}

          ${generateContentList()}
          
          <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-top: 30px;">
            You can always access your masterclass content by visiting the link below:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.SITE_URL}/masterclasses/${masterclass.id}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Go to Masterclass
            </a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>&copy; ${new Date().getFullYear()} GrowPro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 [${new Date().toISOString()}] Attempting to send email via Gmail API to: ${email} for masterclass "${masterclass.title}".`);
    const start = Date.now();
    await sendEmail(
      email,
      `✅ Your Purchase Confirmation for: ${masterclass.title}`,
      htmlContent
    );
    console.log(`✅ [${new Date().toISOString()}] Successfully sent email to ${email} in ${Date.now() - start} ms.`);
  } catch (err: any) {
    // --- ✅ NEW: More detailed error logging ---
    console.error(`❌ [${new Date().toISOString()}] GMAIL SEND ERROR for user ${email} on masterclass "${masterclass.title}":`, err.message);
    console.error(`❌ [${new Date().toISOString()}] Full Gmail API error details:`, err); // Log full error object for more context

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to send purchase confirmation email",
        details: err.message,
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true, // Even if email fails, the purchase is successful. This function's job is just to send the email.
      message: `Email sending process completed for ${email}. Check logs for success/failure.`,
    }),
  };
};

function errorResponse(msg: string) {
  console.warn(`⚠️ [${new Date().toISOString()}] Validation error:`, msg);
  return {
    statusCode: 400,
    body: JSON.stringify({ error: msg }),
  };
}
