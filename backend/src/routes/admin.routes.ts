/**
 * Admin Routes (ADMIN role only)
 */

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/authenticate';

export const adminRouter = Router();

// All admin routes require authentication + ADMIN role
adminRouter.use(authenticate, requireAdmin);

// Platform stats
adminRouter.get('/stats', AdminController.getStats);

// Shop / Vendor management
adminRouter.get('/vendor-types', AdminController.getVendorTypes);
adminRouter.get('/vendors', AdminController.listVendors);
adminRouter.post('/vendors', AdminController.createVendor);
adminRouter.patch('/vendors/:id', AdminController.updateVendor);
adminRouter.delete('/vendors/:id', AdminController.deleteVendor);
adminRouter.patch('/vendors/:id/status', AdminController.updateVendorStatus);

// Menu management (Categories & Products)
adminRouter.get('/vendors/:id/menu', AdminController.getVendorMenu);
adminRouter.post('/vendors/:id/categories', AdminController.createCategory);
adminRouter.delete('/categories/:id', AdminController.deleteCategory);
adminRouter.post('/vendors/:id/products', AdminController.createProduct);
adminRouter.patch('/products/:id', AdminController.updateProduct);
adminRouter.delete('/products/:id', AdminController.deleteProduct);

// Orders management
adminRouter.get('/orders', AdminController.listOrders);
adminRouter.patch('/orders/:id/status', AdminController.updateOrderStatus);

// Customers & Users management
adminRouter.get('/customers', AdminController.listCustomers);
adminRouter.get('/users', AdminController.listUsers);
adminRouter.patch('/users/:id', AdminController.updateUser);

// Search Tags management
adminRouter.get('/tags', AdminController.listSearchTags);
adminRouter.post('/tags', AdminController.createSearchTag);
adminRouter.patch('/tags/:id', AdminController.updateSearchTag);
adminRouter.delete('/tags/:id', AdminController.deleteSearchTag);

// Banner / Updates Cards management
adminRouter.get('/banners', AdminController.listBannerCards);
adminRouter.post('/banners', AdminController.createBannerCard);
adminRouter.patch('/banners/:id', AdminController.updateBannerCard);
adminRouter.delete('/banners/:id', AdminController.deleteBannerCard);
