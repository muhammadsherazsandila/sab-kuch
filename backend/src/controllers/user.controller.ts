/**
 * User Controller — self-service profile & address management
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';

export const UserController = {
  /** GET /api/v1/users/me */
  async getProfile(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerId: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        notificationsEnabled: true,
        city: true,
        addresses: {
          include: { city: true },
          orderBy: { isDefault: 'desc' },
        },
        createdAt: true,
      },
    });
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  },

  /** PATCH /api/v1/users/me */
  async updateProfile(req: Request, res: Response) {
    const { name, phone, cityId, notificationsEnabled } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        cityId: cityId !== undefined ? cityId : undefined,
        notificationsEnabled:
          notificationsEnabled !== undefined ? Boolean(notificationsEnabled) : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        customerId: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        notificationsEnabled: true,
        city: true,
        addresses: {
          include: { city: true },
          orderBy: { isDefault: 'desc' },
        },
        createdAt: true,
      },
    });
    return sendSuccess(res, user, 'Profile updated');
  },

  /** POST /api/v1/users/me/push-subscription */
  async subscribePush(req: Request, res: Response) {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return sendError(res, 'Invalid push subscription payload', 400);
      }

      await prisma.pushSubscription.upsert({
        where: { endpoint },
        update: {
          userId: req.user!.userId,
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
        },
        create: {
          userId: req.user!.userId,
          endpoint,
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
        },
      });

      return sendSuccess(res, null, 'Push subscription saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save push subscription';
      return sendError(res, message, 500);
    }
  },

  /** GET /api/v1/users/me/notifications */
  async getNotifications(req: Request, res: Response) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return sendSuccess(res, notifications);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      return sendError(res, message, 500);
    }
  },

  /** GET /api/v1/users/me/notifications/unread-count */
  async getUnreadCount(req: Request, res: Response) {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.user!.userId, isRead: false },
      });
      return sendSuccess(res, { unreadCount: count });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch unread count';
      return sendError(res, message, 500);
    }
  },

  /** PATCH /api/v1/users/me/notifications/:id/read */
  async markNotificationAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.notification.updateMany({
        where: { id: id as string, userId: req.user!.userId },
        data: { isRead: true },
      });
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update notification';
      return sendError(res, message, 500);
    }
  },

  /** PATCH /api/v1/users/me/notifications/read-all */
  async markAllNotificationsAsRead(req: Request, res: Response) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, isRead: false },
        data: { isRead: true },
      });
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark all as read';
      return sendError(res, message, 500);
    }
  },


  /** GET /api/v1/users/me/addresses */
  async getAddresses(req: Request, res: Response) {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      include: { city: true },
      orderBy: { isDefault: 'desc' },
    });
    return sendSuccess(res, addresses);
  },

  /** POST /api/v1/users/me/addresses */
  async addAddress(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { label, hostelName, streetNo, roomNo, line1, line2, cityId, isDefault, postalCode } = req.body;

    // Resolve or create City (Hostel City, Islamabad)
    let finalCityId = cityId;
    if (!finalCityId) {
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
      finalCityId = city.id;
    }

    // Format line1: e.g. "Iqbal Hostel, Street 3" or line1 if directly given
    const computedLine1 =
      line1 ||
      [hostelName, streetNo ? (streetNo.toLowerCase().includes('street') ? streetNo : `Street ${streetNo}`) : '']
        .filter(Boolean)
        .join(', ') ||
      'Hostel City';

    // Format line2: e.g. "Room 204"
    const computedLine2 =
      line2 ||
      (roomNo ? (roomNo.toLowerCase().includes('room') ? roomNo : `Room ${roomNo}`) : undefined);

    // If isDefault is true or user has no existing addresses, set this as default
    const existingCount = await prisma.address.count({ where: { userId } });
    const markDefault = isDefault || existingCount === 0;

    if (markDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: label || (hostelName ? `${hostelName} Hostel` : 'Hostel'),
        line1: computedLine1,
        line2: computedLine2,
        cityId: finalCityId,
        postalCode: postalCode || undefined,
        isDefault: markDefault,
      },
      include: { city: true },
    });

    return sendSuccess(res, address, 'Address saved successfully', 201);
  },

  /** PATCH /api/v1/users/me/addresses/:id */
  async updateAddress(req: Request, res: Response) {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { label, hostelName, streetNo, roomNo, line1, line2, isDefault } = req.body;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const computedLine1 =
      line1 ||
      (hostelName
        ? [hostelName, streetNo ? (streetNo.toLowerCase().includes('street') ? streetNo : `Street ${streetNo}`) : '']
            .filter(Boolean)
            .join(', ')
        : undefined);

    const computedLine2 =
      line2 ||
      (roomNo ? (roomNo.toLowerCase().includes('room') ? roomNo : `Room ${roomNo}`) : undefined);

    const address = await prisma.address.update({
      where: { id: id as string },
      data: {
        label: label !== undefined ? label : undefined,
        line1: computedLine1 !== undefined ? computedLine1 : undefined,
        line2: computedLine2 !== undefined ? computedLine2 : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
      include: { city: true },
    });

    return sendSuccess(res, address, 'Address updated successfully');
  },

  /** DELETE /api/v1/users/me/addresses/:id */
  async deleteAddress(req: Request, res: Response) {
    await prisma.address.deleteMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
    });
    return sendSuccess(res, null, 'Address removed');
  },
};
