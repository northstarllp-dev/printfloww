import nodemailer from "nodemailer";
import { getAppBaseUrl } from "./utils";

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
}) {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured, skipping customer email.");
    return;
  }
  const trackingUrl = `${getAppBaseUrl()}/track/${options.trackingToken}`;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: "Payment Successful - PrintFloww",
      html: `
        <div style="font-family: sans-serif; color: #1c1917; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f766e;">Thank you for your order, ${options.customerName}!</h2>
          <p>We have successfully received your payment for order <strong>PF-${options.orderNumber}</strong>.</p>
          <p>Your documents are now being prepared for printing.</p>
          <br/>
          <p>You can track the live status of your printing job and securely download your receipt here. <strong>Please show this email to the print shop when you pick up your order.</strong></p>
          <a href="${trackingUrl}" style="display:inline-block;padding:12px 24px;background:#0f766e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:10px;">Track Order</a>
        </div>
      `
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
