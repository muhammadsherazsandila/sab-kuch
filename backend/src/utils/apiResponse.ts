/**
 * Standardised API response helpers.
 * Every endpoint uses these to maintain a consistent response envelope.
 *
 * Success:  { success: true,  data: T,      message?: string, meta?: PaginationMeta }
 * Error:    { success: false, error: string, details?: unknown }
 */

import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Send a 200 / 201 success response */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  meta?: PaginationMeta
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

/** Send an error response */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
