/**
 * Vendor Controller — CRUD for Vendors + Operating Hours
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError, PaginationMeta } from '../utils/apiResponse';

export const VendorController = {
  /** GET /api/v1/vendors — paginated, filterable list of active vendors */
  async listVendors(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const city = req.query.city as string | undefined;
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;

    const where = {
      status: 'ACTIVE' as const,
      ...(city ? { city: { name: { contains: city, mode: 'insensitive' as const } } } : {}),
      ...(type ? { vendorType: { name: { contains: type, mode: 'insensitive' as const } } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vendorType: true,
          city: true,
          operatingHours: true,
        },
        orderBy: { averageRating: 'desc' },
      }),
      prisma.vendor.count({ where }),
    ]);

    const meta: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return sendSuccess(res, vendors, undefined, 200, meta);
  },

  /** GET /api/v1/vendors/:slug */
  async getVendor(req: Request, res: Response) {
    const param = req.params.slug as string;
    let vendor = await prisma.vendor.findUnique({
      where: { slug: param },
      include: {
        vendorType: true,
        city: true,
        operatingHours: true,
        categories: {
          where: { isActive: true },
          include: {
            products: { where: { status: 'AVAILABLE' }, orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!vendor) {
      vendor = await prisma.vendor.findUnique({
        where: { id: param },
        include: {
          vendorType: true,
          city: true,
          operatingHours: true,
          categories: {
            where: { isActive: true },
            include: {
              products: { where: { status: 'AVAILABLE' }, orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    if (!vendor) return sendError(res, 'Vendor not found', 404);
    return sendSuccess(res, vendor);
  },

  /** POST /api/v1/vendors (ADMIN) */
  async createVendor(req: Request, res: Response) {
    const data = req.body;
    try {
      const vendor = await prisma.vendor.create({ data });
      return sendSuccess(res, vendor, 'Vendor created', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create vendor';
      return sendError(res, message, 400);
    }
  },

  /** PATCH /api/v1/vendors/:id */
  async updateVendor(req: Request, res: Response) {
    try {
      const vendor = await prisma.vendor.update({
        where: { id: req.params.id as string },
        data: req.body,
      });
      return sendSuccess(res, vendor, 'Vendor updated');
    } catch {
      return sendError(res, 'Vendor not found', 404);
    }
  },

  /** DELETE /api/v1/vendors/:id — soft delete via status */
  async deleteVendor(req: Request, res: Response) {
    await prisma.vendor.update({
      where: { id: req.params.id as string },
      data: { status: 'INACTIVE' },
    });
    return sendSuccess(res, null, 'Vendor deactivated');
  },

  /** GET /api/v1/vendors/:id/hours */
  async getOperatingHours(req: Request, res: Response) {
    const hours = await prisma.operatingHours.findMany({
      where: { vendorId: req.params.id as string },
      orderBy: { dayOfWeek: 'asc' },
    });
    return sendSuccess(res, hours);
  },

  /**
   * PUT /api/v1/vendors/:id/hours
   * Accepts an array of 7 day objects and upserts all atomically.
   */
  async upsertOperatingHours(req: Request, res: Response) {
    const id = req.params.id as string;
    const hours: Array<{
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }> = req.body;

    // Use a transaction to replace all hours atomically
    const result = await prisma.$transaction(
      hours.map((h) =>
        prisma.operatingHours.upsert({
          where: { vendorId_dayOfWeek: { vendorId: id, dayOfWeek: h.dayOfWeek } },
          update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
          create: { vendorId: id, ...h },
        })
      )
    );

    return sendSuccess(res, result, 'Operating hours saved');
  },
};
