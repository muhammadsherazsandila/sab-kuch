/**
 * Global Express error handler.
 * Catches anything thrown from route handlers / async wrappers
 * and returns a clean JSON error response.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  // Always log the full stack in development
  if (process.env.NODE_ENV === 'development') {
    logger.error(`[ErrorHandler] ${err.message}`, err.stack);
  } else if (statusCode >= 500) {
    logger.error(`[ErrorHandler] ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
