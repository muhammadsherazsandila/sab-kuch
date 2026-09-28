/**
 * Authentication middleware.
 *
 * Reads the Bearer token from the Authorization header, verifies it,
 * and attaches the decoded payload to req.user.
 * Routes that call this middleware require a valid JWT to proceed.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "
  const payload = verifyAccessToken(token);

  if (!payload) {
    sendError(res, 'Invalid or expired token', 401);
    return;
  }

  req.user = payload;
  next();
}

/** Allow admin-only access */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    sendError(res, 'Admin access required', 403);
    return;
  }
  next();
}

/** Allow vendor owner or admin */
export function requireVendorOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!['VENDOR_OWNER', 'ADMIN'].includes(req.user?.role || '')) {
    sendError(res, 'Vendor or Admin access required', 403);
    return;
  }
  next();
}
