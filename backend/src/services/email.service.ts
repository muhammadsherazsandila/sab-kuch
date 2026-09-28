/**
 * Email Service — Supports EmailJS (primary) and Resend (fallback/future switch)
 *
 * Configured via EMAIL_PROVIDER in .env:
 * - EMAIL_PROVIDER="emailjs" (default) -> uses EmailJS
 * - EMAIL_PROVIDER="resend"  -> uses Resend
 */

import emailjs from "@emailjs/nodejs";
import { Resend } from "resend";
import { logger } from "../utils/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.RESEND_FROM_NAME || "Sab Kuch"} <${process.env.RESEND_FROM_EMAIL || "noreply@sabkuch.app"}>`;

export const emailService = {
  /**
   * Main OTP dispatcher.
   * Uses EmailJS by default unless EMAIL_PROVIDER="resend".
   */
  async sendOtp(to: string, otp: string): Promise<void> {
    const provider = (process.env.EMAIL_PROVIDER || "emailjs").toLowerCase();

    if (provider === "resend") {
      return this.sendOtpViaResend(to, otp);
    }

    return this.sendOtpViaEmailJS(to, otp);
  },

  /**
   * Send OTP email via EmailJS (@emailjs/nodejs)
   */
  async sendOtpViaEmailJS(to: string, otp: string): Promise<void> {
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey) {
      const msg = "EmailJS credentials missing (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY)";
      logger.warn(`[EmailJS] ${msg}. In development, OTP is: ${otp} for ${to}`);
      if (process.env.NODE_ENV === "development") {
        console.log(`\n========================================\n[DEV OTP] For ${to}: ${otp}\n========================================\n`);
        return;
      }
      throw new Error(msg);
    }

    try {
      const templateParams = {
        to_email: to,
        email: to,
        recipient: to,
        to_name: to.split("@")[0] || "User",
        otp,
        passcode: otp,
        code: otp,
        expiry_minutes: process.env.OTP_EXPIRY_MINUTES || "10",
        message: `Your Sab Kuch verification code is: ${otp}`,
        app_name: "Sab Kuch",
      };

      await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        {
          publicKey,
          ...(privateKey ? { privateKey } : {}),
        }
      );

      logger.info(`[EmailJS] OTP sent successfully to ${to}`);
    } catch (error) {
      logger.error("[EmailJS] Failed to send OTP email:", error);
      // In development, also show OTP in console so login flow is never blocked
      if (process.env.NODE_ENV === "development") {
        console.log(`\n========================================\n[DEV OTP FALLBACK] For ${to}: ${otp}\n========================================\n`);
      }
      throw error;
    }
  },

  /**
   * Send OTP email via Resend (preserved for future switch)
   */
  async sendOtpViaResend(to: string, otp: string): Promise<void> {
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
      logger.info(`[Resend] OTP ${otp} sent to ${to}`);
    } catch (error) {
      logger.error("[Resend] Failed to send OTP email:", error);
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
    const provider = (process.env.EMAIL_PROVIDER || "emailjs").toLowerCase();

    if (provider === "emailjs" && process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID) {
      try {
        await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          {
            to_email: to,
            email: to,
            orderNumber,
            total: `Rs. ${total.toFixed(0)}`,
            message: `Order ${orderNumber} has been placed successfully. Total: Rs. ${total.toFixed(0)}`,
          },
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID,
            ...(process.env.EMAILJS_PRIVATE_KEY ? { privateKey: process.env.EMAILJS_PRIVATE_KEY } : {}),
          }
        );
        return;
      } catch (err) {
        logger.warn("[EmailJS] Failed to send order confirmation, trying Resend:", err);
      }
    }

    try {
      await resend.emails.send({
        from: FROM,
        to,
        subject: `Order Confirmed — ${orderNumber}`,
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #ff4500;">Your order is confirmed! 🎉</h2>
            <p>Order <strong>${orderNumber}</strong> has been placed successfully.</p>
            <p>Total: <strong>Rs. ${total.toFixed(2)}</strong></p>
            <p>We'll notify you as your order progresses. Track it in the app.</p>
          </div>
        `,
      });
    } catch (error) {
      logger.error("Failed to send order confirmation email:", error);
    }
  },
};
