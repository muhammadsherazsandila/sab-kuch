/**
 * Order Controller — Place, retrieve, and update orders
 *
 * Key design decisions:
 * - Input validated upstream by Zod schemas in order.routes.ts
 * - Prices are always calculated server-side from DB values (never trusted from client)
 * - Status transitions are validated against an explicit allowed-transitions map
 * - Every status change is appended to OrderStatusHistory for full auditability
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { OrderStatus } from '@prisma/client';
import {
  PlaceOrderInput,
  PlaceCustomOrderInput,
  UpdateOrderStatusInput,
} from '../validation/schemas';
import { NotificationService } from '../services/notification.service';


export const OrderController = {
  /**
   * POST /api/v1/orders
   * Body: { vendorId, addressId, items: [{ productId, quantity, notes }], notes, promotionId? }
   *
   * Calculates all prices server-side to prevent client-side manipulation.
   */
  async placeOrder(req: Request, res: Response) {
    const userId = req.user!.userId;
    // req.body is pre-validated and typed by PlaceOrderSchema
    const { vendorId, addressId, items, notes, promotionId } = req.body as PlaceOrderInput;

    // Fetch vendor for delivery fee
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return sendError(res, 'Vendor not found', 404);

    // Fetch products to calculate prices server-side (never trust client prices)
    const productIds: string[] = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return sendError(res, `Product with ID ${item.productId} was not found`, 400);
      }
      const unitPrice = product.discountedPrice ?? product.price;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        notes: item.notes || undefined,
      });
    }

    const deliveryFee = vendor.deliveryFee;
    const total = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        customerId: userId,
        vendorId,
        addressId: addressId || undefined,
        notes: notes || undefined,
        promotionId: promotionId || undefined,
        subtotal,
        deliveryFee,
        total,
        type: 'STANDARD',
        status: 'PENDING',
        items: { create: orderItems },
        statusHistory: {
          create: { status: 'PENDING', changedBy: userId },
        },
      },
      include: {
        items: { include: { product: true } },
        vendor: true,
        statusHistory: true,
      },
    });

    return sendSuccess(res, order, 'Order placed successfully', 201);
  },

  /**
   * POST /api/v1/orders/custom
   * Body: { addressId, description, preferredShop, estimatedBudget }
   *
   * Creates a free-text custom order — no products selected, just a description.
   */
  async placeCustomOrder(req: Request, res: Response) {
    const userId = req.user!.userId;
    // req.body is pre-validated and typed by PlaceCustomOrderSchema
    const { addressId, description, preferredShop, estimatedBudget } = req.body as PlaceCustomOrderInput;

    // Custom delivery fee (platform can adjust dynamically via env var)
    const deliveryFee = parseFloat(process.env.CUSTOM_ORDER_DELIVERY_FEE || '50');

    const order = await prisma.order.create({
      data: {
        customerId: userId,
        addressId,
        type: 'CUSTOM',
        status: 'PENDING',
        deliveryFee,
        total: deliveryFee,
        customRequest: {
          create: { description, preferredShop, estimatedBudget, deliveryFee },
        },
        statusHistory: {
          create: { status: 'PENDING', changedBy: userId },
        },
      },
      include: { customRequest: true, statusHistory: true },
    });

    return sendSuccess(res, order, 'Custom order placed', 201);
  },

  /**
   * GET /api/v1/orders/mine
   * Query: ?status=active | ?status=history | (none = all)
   */
  async getMyOrders(req: Request, res: Response) {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;

    // Define which statuses are "active" vs "history"
    const activeStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'ON_THE_WAY',
    ];
    const historyStatuses: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'REFUNDED'];

    const where: Record<string, unknown> = { customerId: userId };
    if (status === 'active') where.status = { in: activeStatuses };
    if (status === 'history') where.status = { in: historyStatuses };

    const orders = await prisma.order.findMany({
      where,
      include: {
        vendor: { select: { name: true, logoUrl: true, slug: true } },
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        customRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, orders);
  },

  /** GET /api/v1/orders/:id */
  async getOrder(req: Request, res: Response) {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id as string, customerId: req.user!.userId },
      include: {
        vendor: true,
        items: { include: { product: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        customRequest: true,
        deliveryAddress: true,
        rider: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    if (!order) return sendError(res, 'Order not found', 404);
    return sendSuccess(res, order);
  },

  /**
   * PATCH /api/v1/orders/:id/status
   * Body: { status: OrderStatus, note?: string }
   *
   * Enforces a strict state machine — only valid transitions are allowed.
   */
  async updateStatus(req: Request, res: Response) {
    // req.body is pre-validated and typed by UpdateOrderStatusSchema
    const { status, note } = req.body as UpdateOrderStatusInput;
    const changedBy = req.user!.userId;

    // State machine: maps each status to the set of valid next statuses
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['ON_THE_WAY'],
      ON_THE_WAY: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: ['REFUNDED'],
      REFUNDED: [],
    };

    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) return sendError(res, 'Order not found', 404);

    if (!validTransitions[order.status].includes(status)) {
      return sendError(res, `Cannot transition from ${order.status} to ${status}`, 400);
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id as string },
      data: {
        status,
        statusHistory: { create: { status, note, changedBy } },
      },
      include: {
        vendor: { select: { name: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

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
    const body = `Your order from ${updated.vendor?.name || 'Shop'} is now ${status.replace(/_/g, ' ').toLowerCase()}.`;

    NotificationService.notifyUser(updated.customerId, title, body, {
      orderId: updated.id,
      orderNumber: updated.orderNumber,
      status,
      type: 'ORDER_UPDATE',
    }).catch((err) => console.error('[Order Notification Error]:', err));

    return sendSuccess(res, updated, 'Order status updated');
  },
};

