/**
 * Vendor Routes (Public + Protected)
 *
 * GET    /api/v1/vendors            — list all active vendors (public)
 * GET    /api/v1/vendors/:slug      — get single vendor with categories+products
 * POST   /api/v1/vendors            — create vendor (ADMIN only)
 * PATCH  /api/v1/vendors/:id        — update vendor (VENDOR_OWNER or ADMIN)
 * DELETE /api/v1/vendors/:id        — soft-delete vendor (ADMIN only)
 * GET    /api/v1/vendors/:id/hours  — get operating hours
 * PUT    /api/v1/vendors/:id/hours  — upsert operating hours (VENDOR_OWNER or ADMIN)
 */

import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticate, requireAdmin, requireVendorOrAdmin } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  CreateVendorSchema,
  UpdateVendorSchema,
  OperatingHoursSchema,
} from '../validation/schemas';

export const vendorRouter = Router();

vendorRouter.get('/', VendorController.listVendors);
vendorRouter.get('/:slug', VendorController.getVendor);
vendorRouter.post('/', authenticate, requireAdmin, validate(CreateVendorSchema), VendorController.createVendor);
vendorRouter.patch('/:id', authenticate, requireVendorOrAdmin, validate(UpdateVendorSchema), VendorController.updateVendor);
vendorRouter.delete('/:id', authenticate, requireAdmin, VendorController.deleteVendor);
vendorRouter.get('/:id/hours', VendorController.getOperatingHours);
vendorRouter.put('/:id/hours', authenticate, requireVendorOrAdmin, validate(OperatingHoursSchema), VendorController.upsertOperatingHours);
