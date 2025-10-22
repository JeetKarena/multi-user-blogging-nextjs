// src/lib/services/email-service.ts
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private resend: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourblog.com';

      const result = await this.resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      console.log('Email sent successfully:', result.data?.id);
    } catch (error) {
      console.error('Email sending failed:', error);
      // In production, you might want to throw an error or use a queue
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to Our Blog</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Welcome to Our Blog, ${name}!</h1>
            <p>Thank you for registering. We're excited to have you as part of our community.</p>
            <p>You can now:</p>
            <ul>
              <li>Create and publish blog posts</li>
              <li>Comment on articles</li>
              <li>Engage with other writers</li>
              <li>Build your author profile</li>
            </ul>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Next steps:</strong></p>
              <ol>
                <li>Complete your profile</li>
                <li>Write your first blog post</li>
                <li>Explore categories and trending topics</li>
              </ol>
            </div>
            <p>Happy blogging!</p>
            <br>
            <p>Best regards,<br><strong>The Blog Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Our Blog!',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Password Reset Request</h1>
            <p>You requested a password reset for your account.</p>
            <p>Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour for security reasons.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
            </p>
            <br>
            <p>Best regards,<br><strong>The Blog Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #16a34a;">Verify Your Email Address</h1>
            <p>Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This verification link will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              If the button doesn't work, copy and paste this URL into your browser:<br>
              <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
            </p>
            <br>
            <p>Best regards,<br><strong>The Blog Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  async sendPostPublishedNotification(email: string, postTitle: string, postSlug: string): Promise<void> {
    const postUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/blog/${postSlug}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your Post is Live!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">🎉 Your Post is Live!</h1>
            <p>Congratulations! Your post "<strong>${postTitle}</strong>" has been published successfully.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${postUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Your Post
              </a>
            </div>
            <p>Share your post with your audience and start engaging with readers!</p>
            <br>
            <p>Best regards,<br><strong>The Blog Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Your Post is Live!',
      html,
    });
  }

  async sendOTPEmail(email: string, otp: string, name?: string): Promise<void> {
    const greeting = name ? `Hello ${name},` : 'Hello,';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email - OTP Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">🔐 Verify Your Email</h1>
            <p>${greeting}</p>
            <p>Welcome to our blogging platform! To complete your registration, please use the following One-Time Password (OTP):</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f3f4f6; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; display: inline-block;">
                <h2 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h2>
              </div>
            </div>
            <p><strong>Important:</strong> This OTP will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request this registration, please ignore this email.</p>
            <br>
            <p>Best regards,<br><strong>The Blog Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - OTP Code',
      html,
    });
  }

  async sendPasswordResetOTPEmail(email: string, otp: string, name?: string): Promise<void> {
    const greeting = name ? `Hello ${name},` : 'Hello,';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password - OTP Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">🔐 Reset Your Password</h1>
            <p>${greeting}</p>
            <p>We received a request to reset your password for your blogging platform account. To proceed with the password reset, please use the following One-Time Password (OTP):</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f3f4f6; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; display: inline-block;">
                <h2 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h2>
              </div>
            </div>
            <p><strong>Important:</strong> This OTP will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <br>
            <p>Best regards,<br><strong>The Blog Team</strong></p>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - OTP Code',
      html,
    });
  }
}