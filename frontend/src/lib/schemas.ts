/**
 * Frontend Zod Validation Schemas
 *
 * These schemas validate form inputs before they are submitted to the API.
 * They intentionally mirror the backend schemas in /backend/src/validation/schemas.ts
 * but are kept separate so the frontend bundle doesn't import Node-only modules.
 *
 * Each schema exports:
 *   - The Zod schema object (for safeParse / parse)
 *   - An inferred TypeScript type
 *   - A helper to extract flat field-level error messages
 */

import { z } from 'zod';

// ── Shared primitives ────────────────────────────────────────────────────────

const email = z
  .string({ error: 'Email is required' })
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim();

// ── Auth ─────────────────────────────────────────────────────────────────────

export const RequestOtpSchema = z.object({
  email,
});
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  email,
  otp: z
    .string({ error: 'OTP is required' })
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain digits only'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

// ── Custom Order form (Step 1) ────────────────────────────────────────────────

export const CustomOrderStep1Schema = z.object({
  description: z
    .string({ error: 'Please describe what you need' })
    .trim()
    .min(10, 'Please describe your order in at least 10 characters')
    .max(1000, 'Description is too long (max 1000 characters)'),

  preferredShop: z
    .string()
    .trim()
    .max(120, 'Shop name is too long')
    .optional()
    .or(z.literal('')),

  estimatedBudget: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => !v || (!isNaN(Number(v)) && Number(v) > 0),
      { message: 'Budget must be a positive number' }
    ),
});
export type CustomOrderStep1Input = z.infer<typeof CustomOrderStep1Schema>;

export const CustomOrderStep2Schema = z.object({
  addressLine: z
    .string({ error: 'Delivery address is required' })
    .trim()
    .min(10, 'Please enter your full delivery address'),
});
export type CustomOrderStep2Input = z.infer<typeof CustomOrderStep2Schema>;

// ── Utility: extract field-level error messages from a ZodError ──────────────

/**
 * Returns a Record<fieldName, errorMessage> from a Zod safeParse failure.
 * Useful for rendering inline field errors in forms.
 *
 * @example
 * const result = MySchema.safeParse(formData);
 * if (!result.success) {
 *   const errors = getFieldErrors(result.error);
 *   // errors.email === "Please enter a valid email address"
 * }
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  return error.issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path.join('.') || 'root';
    // Only capture the first error per field
    if (!acc[field]) acc[field] = issue.message;
    return acc;
  }, {});
}
