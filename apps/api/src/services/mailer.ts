import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create reusable transporter object using the default SMTP transport
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendResetPasswordEmail = async (to: string, resetLink: string) => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('SMTP configuration is missing. Email not sent.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Wavo" <${env.SMTP_FROM}>`,
      to,
      subject: 'Reset Your Password',
      text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>We received a request to reset the password for your account.</p>
          <p>Click the button below to choose a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px; margin-bottom: 16px;">
            Reset Password
          </a>
          <p>If you did not request a password reset, please ignore this email or reply to let us know. This link is only valid for the next hour.</p>
          <br />
          <p>Thanks,<br />The Wavo Team</p>
        </div>
      `,
    });

    console.log(`Message sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending reset password email', error);
  }
};

export const sendVerificationOtpEmail = async (to: string, otp: string) => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('SMTP configuration is missing. Email not sent.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Wavo" <${env.SMTP_FROM}>`,
      to,
      subject: 'Verify Your Email Address',
      text: `Your email verification code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Thank you for registering. Please use the verification code below to verify your email address.</p>
          <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin-top: 16px; margin-bottom: 16px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6d28d9;">${otp}</span>
          </div>
          <p>This code is valid for 15 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <br />
          <p>Thanks,<br />The Wavo Team</p>
        </div>
      `,
    });

    console.log(`Verification email sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending verification email', error);
  }
};
