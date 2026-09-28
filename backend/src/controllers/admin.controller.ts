/**
 * Admin Controller — platform management
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { OrderStatus, VendorStatus } from '@prisma/client';
import { NotificationService } from '../services/notification.service';


export const AdminController = {
  /** GET /api/v1/admin/stats — high-level platform metrics */
  async getStats(_req: Request, res: Response) {
    const [totalUsers, totalVendors, totalOrders, revenue, pendingOrders] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: 'DELIVERED' },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    const activeVendors = await prisma.vendor.count({ where: { status: 'ACTIVE' } });

    return sendSuccess(res, {
      totalUsers,
      totalVendors,
      activeVendors,
      totalOrders,
      pendingOrders,
      totalRevenue: revenue._sum.total ?? 0,
    });
  },

  /** GET /api/v1/admin/vendor-types — get list of shop types */
  async getVendorTypes(_req: Request, res: Response) {
    let types = await prisma.vendorType.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    if (types.length === 0) {
      // Seed default vendor types if none exist
      const defaultTypes = [
        { name: 'Restaurant', icon: 'utensils', sortOrder: 1 },
        { name: 'Café & Chai', icon: 'coffee', sortOrder: 2 },
        { name: 'Grocery & Snacks', icon: 'shopping-basket', sortOrder: 3 },
        { name: 'Pharmacy', icon: 'pill', sortOrder: 4 },
        { name: 'Stationery & Printing', icon: 'printer', sortOrder: 5 },
      ];
      for (const t of defaultTypes) {
        await prisma.vendorType.upsert({
          where: { name: t.name },
          update: {},
          create: t,
        });
      }
      types = await prisma.vendorType.findMany({ orderBy: { sortOrder: 'asc' } });
    }
    return sendSuccess(res, types);
  },

  /** GET /api/v1/admin/vendors — all vendors with counts */
  async listVendors(_req: Request, res: Response) {
    const vendors = await prisma.vendor.findMany({
      include: {
        vendorType: true,
        city: true,
        _count: {
          select: {
            products: true,
            orders: true,
            categories: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, vendors);
  },

  /** POST /api/v1/admin/vendors — create a new shop */
  async createVendor(req: Request, res: Response) {
    try {
      const data = req.body;

      // Ensure city exists (default to Hostel City, Islamabad)
      let cityId = data.cityId;
      if (!cityId) {
        let city = await prisma.city.findFirst({
          where: { name: { contains: 'Islamabad', mode: 'insensitive' } },
        });
        if (!city) {
          city = await prisma.city.create({
            data: {
              name: 'Hostel City, Islamabad',
              state: 'Islamabad Capital Territory',
              country: 'Pakistan',
            },
          });
        }
        cityId = city.id;
      }

      // Ensure slug
      const slug = (
        data.slug ||
        data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4)
      );

      const vendor = await prisma.vendor.create({
        data: {
          name: data.name,
          slug,
          description: data.description || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || 'Hostel City, Islamabad',
          cityId,
          vendorTypeId: data.vendorTypeId,
          status: data.status || 'ACTIVE',
          estimatedDeliveryMinutes: data.estimatedDeliveryMinutes ?? 25,
          deliveryFee: data.deliveryFee ?? 30,
          minimumOrderAmount: data.minimumOrderAmount ?? 0,
          logoUrl: data.logoUrl || undefined,
          coverImageUrl: data.coverImageUrl || undefined,
        },
        include: {
          vendorType: true,
          city: true,
        },
      });

      // Automatically create operating hours for all 7 days
      const days = [0, 1, 2, 3, 4, 5, 6];
      await Promise.all(
        days.map((day) =>
          prisma.operatingHours.upsert({
            where: { vendorId_dayOfWeek: { vendorId: vendor.id, dayOfWeek: day } },
            update: {},
            create: {
              vendorId: vendor.id,
              dayOfWeek: day,
              openTime: '09:00',
              closeTime: '23:00',
              isClosed: false,
            },
          })
        )
      );

      // Automatically create a default category
      await prisma.category.create({
        data: {
          vendorId: vendor.id,
          name: 'General Menu',
          description: 'Main items and offerings',
          sortOrder: 1,
        },
      });

      return sendSuccess(res, vendor, 'Shop created successfully', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create shop';
      return sendError(res, message, 400);
    }
  },

  /** PATCH /api/v1/admin/vendors/:id — update shop details */
  async updateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const vendor = await prisma.vendor.update({
        where: { id: id as string },
        data: {
          name: data.name,
          description: data.description,
          phone: data.phone,
          email: data.email,
          address: data.address,
          deliveryFee: data.deliveryFee,
          estimatedDeliveryMinutes: data.estimatedDeliveryMinutes,
          minimumOrderAmount: data.minimumOrderAmount,
          vendorTypeId: data.vendorTypeId,
          logoUrl: data.logoUrl,
          coverImageUrl: data.coverImageUrl,
          status: data.status,
        },
        include: {
          vendorType: true,
          city: true,
        },
      });

      return sendSuccess(res, vendor, 'Shop updated successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update shop';
      return sendError(res, message, 400);
    }
  },

  /** PATCH /api/v1/admin/vendors/:id/status — toggle active / close / suspend */
  async updateVendorStatus(req: Request, res: Response) {
    const { status } = req.body as { status: VendorStatus };
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id as string },
      data: { status },
    });
    return sendSuccess(res, vendor, `Shop status set to ${status}`);
  },

  /** DELETE /api/v1/admin/vendors/:id — remove shop */
  async deleteVendor(req: Request, res: Response) {
    const { id } = req.params;
    try {
      // Check if orders exist
      const orderCount = await prisma.order.count({ where: { vendorId: id as string } });
      if (orderCount > 0) {
        // Soft delete / inactivate to preserve order history
        await prisma.vendor.update({
          where: { id: id as string },
          data: { status: 'INACTIVE' },
        });
        return sendSuccess(res, null, 'Shop has existing orders, so it was set to Inactive');
      }

      // No orders: delete products, operating hours, categories, then vendor
      await prisma.product.deleteMany({ where: { vendorId: id as string } });
      await prisma.operatingHours.deleteMany({ where: { vendorId: id as string } });
      await prisma.category.deleteMany({ where: { vendorId: id as string } });
      await prisma.vendor.delete({ where: { id: id as string } });

      return sendSuccess(res, null, 'Shop deleted successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete shop';
      return sendError(res, message, 400);
    }
  },

  // ── Menu Management ────────────────────────────────────────────────────────

  /** GET /api/v1/admin/vendors/:id/menu — get categories and products */
  async getVendorMenu(req: Request, res: Response) {
    const { id } = req.params;
    const categories = await prisma.category.findMany({
      where: { vendorId: id as string },
      include: {
        products: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Also get any products that might not have a category or all products
    const allProducts = await prisma.product.findMany({
      where: { vendorId: id as string },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { categories, products: allProducts });
  },

  /** POST /api/v1/admin/vendors/:id/categories — add category to shop */
  async createCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, imageUrl, sortOrder } = req.body;

      const category = await prisma.category.create({
        data: {
          vendorId: id as string,
          name,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          sortOrder: sortOrder ?? 0,
        },
      });

      return sendSuccess(res, category, 'Category added', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      return sendError(res, message, 400);
    }
  },

  /** DELETE /api/v1/admin/categories/:id — delete a category */
  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Reassign or delete products in this category
      await prisma.product.deleteMany({ where: { categoryId: id as string } });
      await prisma.category.delete({ where: { id: id as string } });
      return sendSuccess(res, null, 'Category removed');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      return sendError(res, message, 400);
    }
  },

  /** POST /api/v1/admin/vendors/:id/products — add product to shop */
  async createProduct(req: Request, res: Response) {
    try {
      const { id: vendorId } = req.params;
      const data = req.body;

      let categoryId = data.categoryId;
      if (!categoryId) {
        // Fallback to first category or create one
        let cat = await prisma.category.findFirst({ where: { vendorId: vendorId as string } });
        if (!cat) {
          cat = await prisma.category.create({
            data: { vendorId: vendorId as string, name: 'General', sortOrder: 1 },
          });
        }
        categoryId = cat.id;
      }

      const product = await prisma.product.create({
        data: {
          vendorId: vendorId as string,
          categoryId,
          name: data.name,
          description: data.description || undefined,
          price: parseFloat(data.price),
          discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : undefined,
          imageUrl: data.imageUrl || undefined,
          unit: data.unit || undefined,
          status: data.status || 'AVAILABLE',
          isFeatured: !!data.isFeatured,
          sortOrder: data.sortOrder ?? 0,
        },
        include: { category: true },
      });

      return sendSuccess(res, product, 'Product added successfully', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      return sendError(res, message, 400);
    }
  },

  /** PATCH /api/v1/admin/products/:id — update product */
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const product = await prisma.product.update({
        where: { id: id as string },
        data: {
          name: data.name,
          description: data.description,
          price: data.price !== undefined ? parseFloat(data.price) : undefined,
          discountedPrice: data.discountedPrice !== undefined ? (data.discountedPrice ? parseFloat(data.discountedPrice) : null) : undefined,
          imageUrl: data.imageUrl,
          unit: data.unit,
          status: data.status,
          isFeatured: data.isFeatured !== undefined ? !!data.isFeatured : undefined,
          categoryId: data.categoryId || undefined,
        },
        include: { category: true },
      });

      return sendSuccess(res, product, 'Product updated successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update product';
      return sendError(res, message, 400);
    }
  },

  /** DELETE /api/v1/admin/products/:id — delete product */
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Check if product is in order items
      const hasOrderItems = await prisma.orderItem.count({ where: { productId: id as string } });
      if (hasOrderItems > 0) {
        await prisma.product.update({
          where: { id: id as string },
          data: { status: 'HIDDEN' },
        });
        return sendSuccess(res, null, 'Product has order history, so it was set to Hidden');
      }

      await prisma.product.delete({ where: { id: id as string } });
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete product';
      return sendError(res, message, 400);
    }
  },

  // ── Orders Management ──────────────────────────────────────────────────────

  /** GET /api/v1/admin/orders — all orders with full customer and item details */
  async listOrders(req: Request, res: Response) {
    const status = req.query.status as string | undefined;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerId: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        deliveryAddress: true,
        customRequest: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, orders);
  },

  /** PATCH /api/v1/admin/orders/:id/status — update order status */
  async updateOrderStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status, note } = req.body as { status: OrderStatus; note?: string };
    const changedBy = req.user?.userId;

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            note: note || undefined,
            changedBy,
          },
        },
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        vendor: { select: { name: true } },
        items: { include: { product: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Notify customer via push notification if notificationsEnabled is on
    const statusLabels: Record<string, string> = {
      CONFIRMED: 'Order Confirmed',
      PREPARING: 'Preparing your Food',
      READY_FOR_PICKUP: 'Order Ready for Pickup',
      ON_THE_WAY: 'Out for Delivery 🛵',
      DELIVERED: 'Order Delivered! 🎉',
      CANCELLED: 'Order Cancelled',
      REFUNDED: 'Order Refunded',
    };

    const title = statusLabels[status] || 'Order Status Update';
    const body = `Your order from ${order.vendor?.name || 'Shop'} is now ${status.replace(/_/g, ' ').toLowerCase()}.`;

    NotificationService.notifyUser(order.customerId, title, body, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status,
      type: 'ORDER_UPDATE',
    }).catch((err) => console.error('[Order Notification Error]:', err));

    return sendSuccess(res, order, `Order status updated to ${status}`);

  },

  // ── Customer Details Management ───────────────────────────────────────────

  /** GET /api/v1/admin/customers — view customer details including their orders with date */
  async listCustomers(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        customerId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        orders: {
          include: {
            vendor: { select: { name: true, slug: true } },
            items: {
              include: {
                product: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Augment with computed stats
    const customers = users.map((u: any) => {
      const totalSpent = u.orders
        .filter((o: any) => o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

      return {
        ...u,
        totalOrders: u.orders.length,
        totalSpent,
      };
    });

    return sendSuccess(res, customers);
  },

  /** GET /api/v1/admin/users — paginated user list */
  async listUsers(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, users);
  },

  /** PATCH /api/v1/admin/users/:id — update role, ban, etc. */
  async updateUser(req: Request, res: Response) {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    return sendSuccess(res, user, 'User updated');
  },

  // ── Search Tags Management ──────────────────────────────────────────────────

  /** GET /api/v1/admin/tags — list all search tags */
  async listSearchTags(req: Request, res: Response) {
    try {
      let tags = await prisma.searchTag.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      if (tags.length === 0) {
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
        await prisma.searchTag.createMany({
          data: DEFAULT_TAGS.map((name, idx) => ({
            name,
            sortOrder: idx,
            isActive: true,
          })),
          skipDuplicates: true,
        });

        tags = await prisma.searchTag.findMany({
          orderBy: { sortOrder: 'asc' },
        });
      }

      return sendSuccess(res, tags);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch search tags';
      return sendError(res, message, 500);
    }
  },

  /** POST /api/v1/admin/tags — add new search tag */
  async createSearchTag(req: Request, res: Response) {
    try {
      const { name, sortOrder, isActive } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Tag name is required', 400);
      }

      const tag = await prisma.searchTag.upsert({
        where: { name: name.trim() },
        update: {
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
        create: {
          name: name.trim(),
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      return sendSuccess(res, tag, 'Search tag added successfully', 201);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create search tag';
      return sendError(res, message, 400);
    }
  },

  /** PATCH /api/v1/admin/tags/:id — update search tag */
  async updateSearchTag(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, sortOrder, isActive } = req.body;

      const tag = await prisma.searchTag.update({
        where: { id: id as string },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        },
      });

      return sendSuccess(res, tag, 'Search tag updated successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update search tag';
      return sendError(res, message, 400);
    }
  },

  /** DELETE /api/v1/admin/tags/:id — delete search tag */
  async deleteSearchTag(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.searchTag.delete({ where: { id: id as string } });
      return sendSuccess(res, null, 'Search tag deleted successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete search tag';
      return sendError(res, message, 400);
    }
  },
};

