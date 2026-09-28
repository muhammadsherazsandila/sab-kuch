/**
 * Product Controller — CRUD for Products
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const ProductController = {
  /** GET /api/v1/products/featured — isFeatured=true, any vendor */
  async getFeaturedProducts(_req: Request, res: Response) {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, status: 'AVAILABLE' },
      include: {
        vendor: { select: { id: true, name: true, slug: true, logoUrl: true } },
        category: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
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
