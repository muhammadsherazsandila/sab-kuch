/**
 * Zod validation middleware factory.
 *
 * Usage:
 *   router.post('/foo', validate(FooSchema), FooController.create)
 *
 * On failure returns:
 *   { success: false, message: "Validation failed", errors: [{ field, message }] }
 *
 * On success, the parsed (type-safe, coerced) value is written to req.body
 * so controllers receive clean data without re-parsing.
 */

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/** Formats a ZodError into a flat array of { field, message } objects. */
function formatZodError(error: ZodError) {
  return error.issues.map((e) => ({
    field: e.path.join(".") || "root",
    message: e.message,
  }));
}

/**
 * Middleware factory — wraps a Zod schema into Express middleware.
 * @param schema  Zod schema to validate req.body against
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodError(result.error),
      });
      return;
    }

    // Replace req.body with the parsed, type-safe, coerced value
    req.body = result.data;
    next();
  };
}

/**
 * Validate query params instead of body.
 * @param schema  Zod schema to validate req.query against
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: formatZodError(result.error),
      });
      return;
    }

    // @ts-expect-error — intentionally overwriting with parsed value
    req.query = result.data;
    next();
  };
}
