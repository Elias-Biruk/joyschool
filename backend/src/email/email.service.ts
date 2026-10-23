import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private fromEmail: string;
  private frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@joyschool.com';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Verification email would be sent to:', email);
      this.logger.warn('Verification link:', `${this.frontendUrl}/verify-email?token=${token}`);
      return;
    }

    const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify your JoyEdu email',
        html: `
          <h2>Welcome to JoyEdu!</h2>
          <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
          <p><a href="${verificationUrl}">Verify Email</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn('Resend not configured. Password reset email would be sent to:', email);
      this.logger.warn('Reset link:', `${this.frontendUrl}/reset-password?token=${token}`);
      return;
    }

    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset your JoyEdu password',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your JoyEdu account. Click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }
}
