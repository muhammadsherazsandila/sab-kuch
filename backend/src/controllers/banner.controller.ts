import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const BannerController = {
  /** GET /api/v1/banners — list active promotional / updates banners for customer app */
  async listPublicBanners(req: Request, res: Response) {
    try {
      let banners = await prisma.bannerCard.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });

      // If empty, auto-seed default banners so the customer app always looks rich
      if (banners.length === 0) {
        const DEFAULT_BANNERS = [
          {
            title: '50% OFF your first order',
            description: 'Use code WELCOME50',
            gradient: 'from-orange-500 to-amber-500',
            imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
            sortOrder: 0,
            isActive: true,
          },
          {
            title: 'Free delivery today 🛵',
            description: 'On all orders above Rs. 300',
            gradient: 'from-amber-500 to-orange-500',
            imageUrl: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&auto=format&fit=crop&q=80',
            sortOrder: 1,
            isActive: true,
          },
          {
            title: "Custom orders now live!",
            description: "We'll buy anything for you",
            gradient: 'from-red-500 to-orange-500',
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
            sortOrder: 2,
            isActive: true,
          },
        ];

        await prisma.bannerCard.createMany({
          data: DEFAULT_BANNERS,
        });

        banners = await prisma.bannerCard.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
      }

      return sendSuccess(res, banners);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch banner cards';
      return sendError(res, message, 500);
    }
  },
};
