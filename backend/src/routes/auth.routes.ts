/**
 * Auth Routes
 *
 * POST /api/v1/auth/request-otp   — send OTP / magic link to email
 * POST /api/v1/auth/verify-otp    — verify OTP and return JWT
 * POST /api/v1/auth/refresh       — refresh access token
 * POST /api/v1/auth/logout        — invalidate token (client-side)
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { RequestOtpSchema, VerifyOtpSchema, GoogleAuthSchema } from '../validation/schemas';

export const authRouter = Router();

authRouter.post('/request-otp', validate(RequestOtpSchema), AuthController.requestOtp);
authRouter.post('/verify-otp', validate(VerifyOtpSchema), AuthController.verifyOtp);
authRouter.post('/google', validate(GoogleAuthSchema), AuthController.googleAuth);
authRouter.post('/refresh', AuthController.refreshToken);
authRouter.post('/logout', AuthController.logout);
