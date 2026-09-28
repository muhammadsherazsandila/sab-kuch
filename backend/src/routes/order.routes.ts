/**
 * Order Routes
 *
 * POST   /api/v1/orders               — place a new order (authenticated)
 * POST   /api/v1/orders/custom        — place a custom order
 * GET    /api/v1/orders/mine          — customer's own orders
 * GET    /api/v1/orders/:id           — order detail
 * PATCH  /api/v1/orders/:id/status    — update order status (VENDOR or ADMIN)
 */

import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, requireVendorOrAdmin } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  PlaceOrderSchema,
  PlaceCustomOrderSchema,
  UpdateOrderStatusSchema,
} from '../validation/schemas';

export const orderRouter = Router();

orderRouter.post('/', authenticate, validate(PlaceOrderSchema), OrderController.placeOrder);
orderRouter.post('/custom', authenticate, validate(PlaceCustomOrderSchema), OrderController.placeCustomOrder);
orderRouter.get('/mine', authenticate, OrderController.getMyOrders);
orderRouter.get('/:id', authenticate, OrderController.getOrder);
orderRouter.patch('/:id/status', authenticate, requireVendorOrAdmin, validate(UpdateOrderStatusSchema), OrderController.updateStatus);
