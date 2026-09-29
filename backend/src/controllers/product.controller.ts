/**
 * Product Controller — CRUD for Products
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const ProductController = {
  /** GET /api/v1/products/featured — isFeatured=true with automatic fallback to available products */
  async getFeaturedProducts(_req: Request, res: Response) {
    // 1. Fetch featured products from active vendors
    let products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        status: 'AVAILABLE',
        vendor: { status: 'ACTIVE' },
      },
      include: {
        vendor: { select: { id: true, name: true, slug: true, logoUrl: true, status: true } },
        category: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    // 2. If fewer than 8 featured products, fill up with any available products from active vendors
    if (products.length < 8) {
      const existingIds = products.map((p: { id: string }) => p.id);
      const additionalProducts = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          status: 'AVAILABLE',
          vendor: { status: 'ACTIVE' },
        },
        include: {
          vendor: { select: { id: true, name: true, slug: true, logoUrl: true, status: true } },
          category: true,
        },
        take: 20 - products.length,
        orderBy: { createdAt: 'desc' },
      });
      products = [...products, ...additionalProducts];
    }

    return sendSuccess(res, products);
  },

  /** GET /api/v1/products/vendor/:vendorId */
  async getProductsByVendor(req: Request, res: Response) {
    const products = await prisma.product.findMany({
      where: { vendorId: req.params.vendorId as string, status: { not: 'HIDDEN' } },
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    return sendSuccess(res, products);
  },

  /** GET /api/v1/products/:id — single product details */
  async getProductById(req: Request, res: Response) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id as string },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              coverImageUrl: true,
              status: true,
              deliveryFee: true,
              estimatedDeliveryMinutes: true,
              operatingHours: true,
            },
          },
          category: true,
        },
      });

      if (!product || product.status === 'HIDDEN') {
        return sendError(res, 'Product not found', 404);
      }

      return sendSuccess(res, product);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch product';
      return sendError(res, message, 500);
    }
  },

  /** POST /api/v1/products */
  async createProduct(req: Request, res: Response) {
    try {
      const product = await prisma.product.create({ data: req.body });
      return sendSuccess(res, product, 'Product created', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      return sendError(res, message, 400);
    }
  },

  /** PATCH /api/v1/products/:id */
  async updateProduct(req: Request, res: Response) {
    try {
      const product = await prisma.product.update({
        where: { id: req.params.id as string },
        data: req.body,
      });
      return sendSuccess(res, product, 'Product updated');
    } catch {
      return sendError(res, 'Product not found', 404);
    }
  },

  /** DELETE /api/v1/products/:id — soft delete (sets status to HIDDEN) */
  async deleteProduct(req: Request, res: Response) {
    await prisma.product.update({
      where: { id: req.params.id as string },
      data: { status: 'HIDDEN' },
    });
    return sendSuccess(res, null, 'Product removed from listing');
  },
};
