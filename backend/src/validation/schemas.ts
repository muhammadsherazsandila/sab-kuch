/**
 * Zod Validation Schemas — Backend
 *
 * All request body / query shapes are defined here as Zod schemas.
 * Each schema is co-located with an inferred TypeScript type.
 *
 * Usage in controllers:
 *   const parsed = RequestSchema.safeParse(req.body);
 *   if (!parsed.success) return sendZodError(res, parsed.error);
 */

import { z } from "zod";

// ── Shared primitives ────────────────────────────────────────────────────────

const cuid = z.string().min(1, { message: "Invalid ID format" });
const email = z
  .string()
  .email({ message: "Invalid email address" })
  .toLowerCase()
  .trim();
const phone = z
  .string()
  .min(7, { message: "Invalid phone number" });
const positiveFloat = z.number({ error: "Must be a number" }).positive();
const nonNegativeFloat = z.number({ error: "Must be a number" }).nonnegative();

// ── Auth ─────────────────────────────────────────────────────────────────────

export const RequestOtpSchema = z.object({
  email,
});
export type RequestOtpInput = z.infer<typeof RequestOtpSchema>;

export const VerifyOtpSchema = z.object({
  email,
  otp: z
    .string()
    .trim()
    .length(6, { message: "OTP must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "OTP must contain only digits" }),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;

// ── User ─────────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80)
    .optional(),
  phone: phone.optional(),
  cityId: cuid.optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const AddressSchema = z.object({
  label: z.string().trim().min(1).max(40).optional().default("Hostel"),
  hostelName: z.string().trim().max(120).optional().nullable().or(z.literal("")),
  streetNo: z.string().trim().max(60).optional().nullable().or(z.literal("")),
  roomNo: z.string().trim().max(60).optional().nullable().or(z.literal("")),
  line1: z.string().trim().max(200).optional().nullable().or(z.literal("")),
  line2: z.string().trim().max(200).optional().nullable().or(z.literal("")),
  cityId: cuid.optional().nullable().or(z.literal("")),
  postalCode: z.string().trim().optional().nullable().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof AddressSchema>;

// ── Vendor ───────────────────────────────────────────────────────────────────

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: "Time must be in HH:MM format (24h)",
  });

export const CreateVendorSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers and hyphens",
    )
    .optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().trim().max(300).optional().nullable().or(z.literal("")),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  cityId: cuid.optional().nullable(),
  vendorTypeId: cuid,
  estimatedDeliveryMinutes: z.number().int().min(5).max(240).optional().default(25),
  minimumOrderAmount: nonNegativeFloat.optional().default(0),
  deliveryFee: nonNegativeFloat.optional().default(30),
  logoUrl: z.string().optional().nullable().or(z.literal("")),
  coverImageUrl: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_REVIEW"]).optional().default("ACTIVE"),
});
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;

export const UpdateVendorSchema = CreateVendorSchema.partial();
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;

export const OperatingHoursSchema = z
  .array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: timeString,
      closeTime: timeString,
      isClosed: z.boolean(),
    }),
  )
  .length(7, {
    message: "Must provide hours for all 7 days (0=Sunday … 6=Saturday)",
  });
export type OperatingHoursInput = z.infer<typeof OperatingHoursSchema>;

// ── Category ─────────────────────────────────────────────────────────────────

export const CreateCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: z.string().trim().max(300).optional().nullable().or(z.literal("")),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  sortOrder: z.number().int().optional().default(0),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

// ── Product ──────────────────────────────────────────────────────────────────

const createProductObject = z.object({
  vendorId: cuid.optional(),
  categoryId: cuid,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  price: positiveFloat,
  discountedPrice: positiveFloat.optional().nullable(),
  unit: z.string().trim().max(20).optional().nullable().or(z.literal("")),
  status: z.enum(["AVAILABLE", "OUT_OF_STOCK", "HIDDEN"]).optional().default("AVAILABLE"),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().int().nonnegative().optional().default(0),
});

export const CreateProductSchema = createProductObject.refine(
  (d) => !d.discountedPrice || d.discountedPrice < d.price,
  {
    message: "Discounted price must be less than the regular price",
    path: ["discountedPrice"],
  },
);
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// Use the plain object (without refine) for partial updates so .partial() works
export const UpdateProductSchema = createProductObject
  .partial()
  .omit({ vendorId: true });
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// ── Order ─────────────────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  productId: cuid,
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(99),
  notes: z.string().trim().max(200).optional().nullable().or(z.literal("")),
});

export const PlaceOrderSchema = z.object({
  vendorId: cuid,
  addressId: cuid.optional().nullable().or(z.literal("")),
  items: z
    .array(OrderItemSchema)
    .min(1, "Order must have at least one item")
    .max(50),
  notes: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  promotionId: cuid.optional().nullable().or(z.literal("")),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export const PlaceCustomOrderSchema = z.object({
  addressId: cuid.optional().nullable().or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(5, "Please describe your order in at least 5 characters")
    .max(1000),
  preferredShop: z.string().trim().max(120).optional().nullable().or(z.literal("")),
  estimatedBudget: positiveFloat.optional().nullable(),
});
export type PlaceCustomOrderInput = z.infer<typeof PlaceCustomOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "ON_THE_WAY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().trim().max(300).optional().nullable().or(z.literal("")),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ── Admin ────────────────────────────────────────────────────────────────────

export const UpdateUserAdminSchema = z.object({
  role: z.enum(["CUSTOMER", "VENDOR_OWNER", "RIDER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateVendorStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_REVIEW"]),
});
