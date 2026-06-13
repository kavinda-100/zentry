import { render } from 'react-email';
import nodemailer from 'nodemailer';
import type {
  EmailVerificationPayload,
  ResetPasswordPayload,
  TwoFactorPayload,
} from '@zentry/types/src/kafka';
import { env } from './env';
import { VerificationEmail } from '../templates/VerificationEmail';
import { ResetPasswordEmail } from '../templates/ResetPasswordEmail';

type MailerOptions = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Main function to send an email using nodemailer and a React component as the email body.
 * @returns A promise that resolves to true if the email was sent successfully, or false if there was an error.
 * @param params - An object containing the recipient's email address, subject, and HTML content of the email.'
 */
async function sendEmail(params: MailerOptions): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  const options = {
    from: `Zentry <${env.SMTP_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  };

  try {
    await transporter.sendMail(options);
    return true;
  } catch (error) {
    console.error('Error sending email in transporter:', error);
    return false;
  }
}

/** * Function to send a verification email to a user. It renders the VerificationEmail React component to HTML and sends it using the sendEmail function.
 * @param to - The recipient's email address.
 * @param otp - The one-time password (OTP) to include in the verification email.
 * @returns A promise that resolves to true if the email was sent successfully, or false if there was an error.
 */
export async function sendVerificationEmail({
  to,
  otp,
}: EmailVerificationPayload): Promise<boolean> {
  // pass the otp as a prop to the VerificationEmail component and render it to HTML
  const html = await render(VerificationEmail({ otp, is2FA: false }));
  // send the email using the sendEmail function
  return sendEmail({ to, subject: 'Verify your email', html });
}

/** * Function to send a two-factor authentication email to a user. It renders the VerificationEmail React component with is2FA set to true and sends it using the sendEmail function.
 * @param to - The recipient's email address.
 * @param otp - The one-time password (OTP) to include in the two-factor authentication email.
 * @returns A promise that resolves to true if the email was sent successfully, or false if there was an error.
 */
export async function sendTwoFactorAuthEmail({ to, otp }: TwoFactorPayload): Promise<boolean> {
  const html = await render(VerificationEmail({ otp, is2FA: true }));
  return sendEmail({ to, subject: 'Two-Factor Authentication', html });
}

/** * Function to send a reset password email to a user.
 * @param to - The recipient's email address.
 * @param otp - The one-time password (OTP) to include in the reset password email.
 * @returns A promise that resolves to true if the email was sent successfully, or false if there was an error.
 */
export async function sendResetPasswordEmail({ to, otp }: ResetPasswordPayload): Promise<boolean> {
  const html = await render(ResetPasswordEmail({ otp }));
  return sendEmail({ to, subject: 'Reset your password', html });
}
