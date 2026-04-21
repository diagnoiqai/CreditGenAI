import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const verifySmtp = () => {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log("INFO: Email functionality is disabled via environment variable.");
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("WARN: SMTP credentials not provided. Email functionality will be limited.");
    return;
  }

  transporter.verify((error, success) => {
    if (error) {
      console.error("ERROR: SMTP Connection Error:", error.message);
      
      if (error.message.includes('5.7.139')) {
        console.log("\n--- HOW TO FIX THIS ERROR (Office 365) ---");
        console.log("1. This error means 'Security Defaults' are blocking basic SMTP authentication.");
        console.log("2. Go to Microsoft 365 Admin Center > Users > Active Users.");
        console.log("3. Select your user > Mail > Manage email apps.");
        console.log("4. Ensure 'Authenticated SMTP' is CHECKED.");
        console.log("5. If you have MFA enabled, you MUST use an 'App Password' instead of your regular password.");
        console.log("-------------------------------------------\n");
      }
    } else {
      console.log("SUCCESS: SMTP Server is ready to take our messages");
    }
  });
};

export const sendEmail = async (options: nodemailer.SendMailOptions) => {
  if (process.env.DISABLE_EMAIL === 'true') {
    console.log("INFO: Email functionality is DISABLED. Logging email to console:");
    console.log(`TO: ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log("BODY (truncated):", options.text?.toString().substring(0, 100));
    return { messageId: 'disabled-by-env' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'CreditGenAI'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      ...options,
    });
    console.log("SUCCESS: Email sent:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("ERROR: Failed to send email:", error.message);
    throw error;
  }
};
