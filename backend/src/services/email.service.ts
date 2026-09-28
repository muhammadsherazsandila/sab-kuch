/**
 * Email Service — powered by Resend
 *
 * Centralises all transactional email sending.
 * Add new email methods here (order confirmation, delivery notification, etc.)
 */

import { Resend } from "resend";
import { logger } from "../utils/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.RESEND_FROM_NAME || "Sab Kuch"} <${process.env.RESEND_FROM_EMAIL || "noreply@sabkuch.app"}>`;

export const emailService = {
  /**
   * Send a 6-digit OTP email to the user.
   * @param to    recipient email address
   * @param otp   6-digit numeric code
   */
  async sendOtp(to: string, otp: string): Promise<void> {
    try {
      await resend.emails.send({
        from: FROM,
        to,
        subject: `Your Sab Kuch OTP: ${otp}`,
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #ff4500; margin-bottom: 8px;">Sab Kuch 🛍️</h2>
            <p style="color: #374151; font-size: 15px;">
              Use the OTP below to log in. It expires in
              <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong>.
            </p>
            <div style="background: #fff7ed; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
              <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #ff4500;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      logger.info(`OTP ${otp} sent to ${to}`);
    } catch (error) {
      // Log but re-throw so the controller can handle it
      logger.error("Failed to send OTP email:", error);
      throw error;
    }
  },

  /**
   * Send an order confirmation email.
   * @param to          recipient email
   * @param orderNumber human-readable order number
   * @param total       order total in rupees
   */
  async sendOrderConfirmation(
    to: string,
    orderNumber: string,
    total: number,
  ): Promise<void> {
    try {
      await resend.emails.send({
        from: FROM,
        to,
        subject: `Order Confirmed — ${orderNumber}`,
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #ff4500;">Your order is confirmed! 🎉</h2>
            <p>Order <strong>${orderNumber}</strong> has been placed successfully.</p>
            <p>Total: <strong>₹${total.toFixed(2)}</strong></p>
            <p>We'll notify you as your order progresses. Track it in the app.</p>
          </div>
        `,
      });
    } catch (error) {
      logger.error("Failed to send order confirmation email:", error);
    }
  },
};
