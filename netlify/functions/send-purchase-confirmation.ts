// netlify/functions/send-purchase-confirmation.ts
import { Handler } from "@netlify/functions";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

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
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const {
      email,
      userName,
      masterclassTitle,
      videoTitle,
      amount,
      orderId,
      paymentId,
      masterclassId,
      videoId,
      purchaseType,
    } = JSON.parse(event.body || "{}");

    if (!email || !masterclassTitle) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: "Missing required fields" }),
      };
    }

    const isPaid = amount > 0;
    const isVideo = purchaseType === "video";
    const isUpcoming = purchaseType === "upcoming_registration";

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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .purchase-details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .amount {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            text-align: center;
            margin: 20px 0;
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
          }
          .receipt {
            background: #f0fdf4;
            padding: 15px;
            border-radius: 8px;
            font-size: 14px;
            color: #166534;
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
            <h1>✅ ${isPaid ? 'Purchase Successful!' : 'Enrollment Confirmed!'}</h1>
            ${isPaid ? '<p>Thank you for your purchase!</p>' : '<p>You have successfully enrolled!</p>'}
          </div>
          <div class="content">
            <h2>Hi ${userName || "there"}!</h2>
            <p>${isPaid ? 'Your payment has been processed successfully.' : 'Great news! Your enrollment is complete.'}</p>
            
            <div class="purchase-details">
              <h3>${isVideo ? '🎥' : '📚'} ${isVideo ? videoTitle : masterclassTitle}</h3>
              ${isVideo ? `<p><strong>Masterclass:</strong> ${masterclassTitle}</p>` : ''}
              ${isPaid ? `<div class="amount">₹${amount}</div>` : '<p style="text-align: center; font-size: 18px; color: #10b981; font-weight: bold;">FREE</p>'}
            </div>

            ${isPaid ? `
              <div class="receipt">
                <strong>📄 Payment Details:</strong><br>
                Order ID: ${orderId}<br>
                ${paymentId ? `Payment ID: ${paymentId}<br>` : ''}
                Amount: ₹${amount}<br>
                Date: ${new Date().toLocaleString()}
              </div>
            ` : ''}

            <p><strong>What's next?</strong></p>
            <ul>
              ${isUpcoming 
                ? '<li>✅ You will receive reminder emails before the event</li><li>🔗 Join link will be sent 2 hours before</li>' 
                : '<li>✅ Access your content immediately</li><li>📺 Watch anytime, anywhere</li>'
              }
              <li>💬 Interact with the content</li>
              <li>📧 Keep this email for your records</li>
            </ul>

            <center>
              <a href="${process.env.SITE_URL}/masterclasses/${masterclassId}" class="button">
                ${isUpcoming ? 'View Event Details' : 'Start Learning Now'}
              </a>
            </center>

            <p>Thank you for being part of our learning community!</p>
            
            <p>Best regards,<br><strong>The Masterclass Team</strong></p>
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@example.com</p>
            <p>&copy; ${new Date().getFullYear()} Masterclass Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      email,
      `${isPaid ? '💳' : '✅'} ${isVideo ? 'Video' : 'Masterclass'} ${isPaid ? 'Purchase' : 'Enrollment'} Confirmed - ${isVideo ? videoTitle : masterclassTitle}`,
      htmlContent
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Purchase confirmation email error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Failed to send email" }),
    };
  }
};