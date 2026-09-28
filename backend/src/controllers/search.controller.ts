/**
 * Search Controller
 *
 * Public search endpoint for shops and products + public search tags.
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

const DEFAULT_TAGS = [
  'Paratha',
  'Roti',
  'Biryani',
  'Chai',
  'Burger',
  'Shawarma',
  'Samosa',
  'Roll Paratha',
  'Cold Drinks',
  'Grocery',
];

export const SearchController = {
  /** GET /api/v1/search/tags — public search tags */
  async getTags(req: Request, res: Response) {
    try {
      let tags = await prisma.searchTag.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      if (tags.length === 0) {
        await prisma.searchTag.createMany({
          data: DEFAULT_TAGS.map((name, idx) => ({
            name,
            sortOrder: idx,
            isActive: true,
          })),
          skipDuplicates: true,
        });

        tags = await prisma.searchTag.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      }

      return sendSuccess(res, tags);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch search tags';
      return sendError(res, message, 500);
    }
  },

  /** GET /api/v1/search?q=query — search shops and products */
  async search(req: Request, res: Response) {
    try {
      const query = (req.query.q as string || '').trim();

      if (!query) {
        return sendSuccess(res, { shops: [], vendors: [], products: [] });
      }


      const [shops, products] = await Promise.all([
        // Search shops: by name, description, vendor type, or shops that serve products matching query
        prisma.vendor.findMany({
          where: {
            status: 'ACTIVE',
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { vendorType: { name: { contains: query, mode: 'insensitive' } } },
              {
                products: {
                  some: {
                    name: { contains: query, mode: 'insensitive' },
                    status: 'AVAILABLE',
                  },
                },
              },
            ],
          },
          include: {
            vendorType: true,
            city: true,
            operatingHours: true,
          },
          take: 20,
        }),

        // Search products: by product name, description, or category name
        prisma.product.findMany({
          where: {
            status: 'AVAILABLE',
            vendor: {
              status: 'ACTIVE',
            },
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { category: { name: { contains: query, mode: 'insensitive' } } },
            ],
          },
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                status: true,
                deliveryFee: true,
                estimatedDeliveryMinutes: true,
              },
            },
            category: true,
          },
          take: 30,
        }),
      ]);

      return sendSuccess(res, { shops, vendors: shops, products, query });
    } catch (err: unknown) {

      const message = err instanceof Error ? err.message : 'Search failed';
      return sendError(res, message, 500);
    }
  },
};
