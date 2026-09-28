/**
 * Auth Controller
 *
 * Handles OTP-based passwordless authentication:
 * 1. requestOtp  — generate a 6-digit OTP, persist it, email via Resend
 * 2. verifyOtp   — validate OTP, create/find user, return JWT
 * 3. refreshToken — (placeholder — implement refresh token rotation later)
 * 4. logout      — client-side token invalidation acknowledgement
 *
 * Note: input validation is handled upstream by the Zod `validate` middleware
 * in auth.routes.ts — controllers receive pre-validated, type-safe req.body.
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { signAccessToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { emailService } from '../services/email.service';
import { RequestOtpInput, VerifyOtpInput, GoogleAuthInput } from '../validation/schemas';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const AuthController = {
  /**
   * POST /api/v1/auth/request-otp
   * Body validated by RequestOtpSchema upstream.
   *
   * Creates a 6-digit OTP valid for OTP_EXPIRY_MINUTES, then emails it.
   */
  async requestOtp(req: Request, res: Response) {
    const { email } = req.body as RequestOtpInput;

    // Generate a cryptographically random 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Upsert user — create if first time, otherwise just find them
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split('@')[0], // temporary name until they set it
        customerId: `SK-${Date.now()}`,
      },
    });

    // Invalidate any existing unused OTPs for this user
    await prisma.otpToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Persist the new OTP
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        token: otp,
        type: 'EMAIL_OTP',
        expiresAt,
      },
    });

    // Send OTP email via Resend
    await emailService.sendOtp(email, otp);

    return sendSuccess(res, null, `OTP sent to ${email}. Valid for ${expiryMinutes} minutes.`);
  },

  /**
   * POST /api/v1/auth/verify-otp
   * Body validated by VerifyOtpSchema upstream.
   *
   * Validates the OTP, marks it used, and returns a signed JWT.
   */
  async verifyOtp(req: Request, res: Response) {
    const { email, otp } = req.body as VerifyOtpInput;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { city: true },
    });
    if (!user) {
      return sendError(res, 'Invalid OTP', 400); // don't leak user existence
    }

    // Find a matching, unused, non-expired OTP
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        token: otp,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpToken) {
      return sendError(res, 'Invalid or expired OTP', 400);
    }

    // Mark OTP as used and verify the user's email
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { usedAt: new Date() },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      include: { city: true },
    });

    // Issue JWT
    const token = signAccessToken({
      userId: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email,
    });

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          customerId: updatedUser.customerId,
          avatarUrl: updatedUser.avatarUrl,
          isVerified: updatedUser.isVerified,
          city: updatedUser.city,
          createdAt: updatedUser.createdAt,
        },
      },
      'Login successful'
    );
  },

  /** POST /api/v1/auth/google */
  async googleAuth(req: Request, res: Response) {
    const { credential } = req.body as GoogleAuthInput;

    try {
      // Verify Google ID Token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return sendError(res, 'Google authentication failed: missing email', 400);
      }

      const email = payload.email.toLowerCase().trim();
      const name = payload.name || payload.given_name || email.split('@')[0];
      const avatarUrl = payload.picture || null;

      // Upsert user with email and Google details
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          isVerified: true,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
        create: {
          email,
          name,
          avatarUrl,
          isVerified: true,
          customerId: `SK-${Date.now()}`,
        },
        include: { city: true },
      });

      // Issue JWT
      const token = signAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      return sendSuccess(
        res,
        {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            customerId: user.customerId,
            avatarUrl: user.avatarUrl,
            isVerified: user.isVerified,
            city: user.city,
            createdAt: user.createdAt,
          },
        },
        'Google login successful'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed';
      return sendError(res, message, 401);
    }
  },

  /** POST /api/v1/auth/refresh — placeholder */
  async refreshToken(_req: Request, res: Response) {
    return sendError(res, 'Refresh token flow not yet implemented', 501);
  },

  /** POST /api/v1/auth/logout */
  async logout(_req: Request, res: Response) {
    // JWTs are stateless; real logout = client discards token.
    // Implement token blacklisting (Redis) if needed.
    return sendSuccess(res, null, 'Logged out successfully');
  },
};
