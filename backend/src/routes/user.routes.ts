/**
 * User Routes (self-service)
 *
 * GET    /api/v1/users/me                    — get own profile
 * PATCH  /api/v1/users/me                   — update own profile
 * GET    /api/v1/users/me/addresses          — list saved addresses
 * POST   /api/v1/users/me/addresses          — add address
 * PATCH  /api/v1/users/me/addresses/:id      — update address
 * DELETE /api/v1/users/me/addresses/:id      — remove address
 */

import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { UpdateProfileSchema, AddressSchema } from '../validation/schemas';

export const userRouter = Router();

userRouter.get('/me', authenticate, UserController.getProfile);
userRouter.patch('/me', authenticate, validate(UpdateProfileSchema), UserController.updateProfile);
userRouter.get('/me/addresses', authenticate, UserController.getAddresses);
userRouter.post('/me/addresses', authenticate, validate(AddressSchema), UserController.addAddress);
userRouter.patch('/me/addresses/:id', authenticate, UserController.updateAddress);
userRouter.delete('/me/addresses/:id', authenticate, UserController.deleteAddress);

// Push & In-App Notifications
userRouter.post('/me/push-subscription', authenticate, UserController.subscribePush);
userRouter.get('/me/notifications', authenticate, UserController.getNotifications);
userRouter.get('/me/notifications/unread-count', authenticate, UserController.getUnreadCount);
userRouter.patch('/me/notifications/read-all', authenticate, UserController.markAllNotificationsAsRead);
userRouter.patch('/me/notifications/:id/read', authenticate, UserController.markNotificationAsRead);

