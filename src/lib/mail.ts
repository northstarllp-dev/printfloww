import nodemailer from "nodemailer";
import { getAppBaseUrl } from "./utils";
import path from "path";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

let fromEmail = process.env.EMAIL_FROM || `PrintFloww <${process.env.SMTP_EMAIL}>`;
if (fromEmail.includes("example.com")) {
  fromEmail = `PrintFloww <${process.env.SMTP_EMAIL}>`;
}

export async function sendCustomerSuccessEmail(options: {
  to: string;
  customerName: string;
  orderNumber: number;
  trackingToken: string;
  shopName: string;
  amount: number;
}) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping customer email.");
    return;
  }
  const trackingUrl = `${getAppBaseUrl()}/track/${options.trackingToken}`;
  const bannerPath = path.join(process.cwd(), "public", "6.png");

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: "Payment Successful - PrintFloww",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; background-color: #003262;">
            <img src="cid:banner" alt="PrintFloww Banner" style="width: 100%; max-width: 600px; height: auto; display: block;" />
          </div>
          <div style="padding: 24px 32px;">
            <h2 style="color: #0f766e; margin-top: 0; font-size: 24px; font-weight: bold;">Order Confirmed!</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #334155;">
              Hi <strong>${options.customerName}</strong>,
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">
              Your payment has been successfully processed, and your print job is officially <strong>confirmed and in progress</strong>.
            </p>
 
            <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #0f766e;">
                <strong>⚠️ Crucial Instruction:</strong> Please save this email and show it to the operator at the print shop when you arrive to pick up your completed print.
              </p>
            </div>
 
            <h3 style="color: #003262; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; color: #475569;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 600;">Order Number:</td>
                <td style="padding: 10px 0; text-align: right; color: #0f766e; font-weight: 700;">PF-${options.orderNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 600;">Selected Print Shop:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #334155;">${options.shopName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; font-weight: 600;">Amount Paid:</td>
                <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #334155;">₹${options.amount}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: 600;">Status:</td>
                <td style="padding: 10px 0; text-align: right;"><span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase;">Paid</span></td>
              </tr>
            </table>
 
            <div style="text-align: center; margin-top: 32px;">
              <a href="${trackingUrl}" style="display: inline-block; padding: 14px 28px; background-color: #0f766e; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Track Live Status
              </a>
            </div>
          </div>
 
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">This is an automated receipt from PrintFloww. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "6.png",
          path: bannerPath,
          cid: "banner"
        }
      ]
    });
  } catch (error) {
    console.error("Failed to send customer email:", error);
  }
}

export async function sendShopNewOrderEmail(options: {
  shopEmail: string;
  orderId: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  amount: number;
  fileCount: number;
}) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping shop email.");
    return;
  }
  const adminUrl = `${getAppBaseUrl()}/admin/orders/${options.orderId}`;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.shopEmail,
      subject: `New Order Received - PF-${options.orderNumber}`,
      html: `
        <div style="font-family: sans-serif; color: #1c1917; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; padding: 20px; border-radius: 8px;">
          <h2 style="color: #0f766e; margin-top: 0;">New Print Order</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f4;"><strong>Order ID:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f4; text-align: right;">PF-${options.orderNumber}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f4;"><strong>Amount Paid:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f4; text-align: right;">₹${options.amount}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f4;"><strong>Files Uploaded:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f5f5f4; text-align: right;">${options.fileCount}</td></tr>
          </table>
          
          <h3 style="color: #44403c; margin-bottom: 10px;">Customer Details</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${options.customerName}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${options.customerPhone}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${options.customerEmail || 'Not provided'}</p>
          
          <br />
          <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#1c1917;color:white;text-decoration:none;border-radius:6px;font-weight:bold;width:100%;text-align:center;box-sizing:border-box;">View Order Dashboard</a>
        </div>
      `
    });
  } catch (error) {
    console.error("Failed to send shop email:", error);
  }
}

export async function sendGenericStatusEmail(options: {
  to: string | null;
  subject: string;
  html: string;
}) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD || !options.to) return;
  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: `
        <div style="font-family: sans-serif; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${options.html}
        </div>
      `
    });
  } catch (error) {
    console.error("Failed to send generic status email:", error);
  }
}
