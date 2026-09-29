/**
 * Product Routes
 *
 * GET    /api/v1/products/featured          — featured products across platform
 * GET    /api/v1/products/vendor/:vendorId  — products for a specific vendor
 * POST   /api/v1/products                  — create product (VENDOR_OWNER or ADMIN)
 * PATCH  /api/v1/products/:id              — update product
 * DELETE /api/v1/products/:id              — soft-delete product
 */

import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate, requireVendorOrAdmin } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { CreateProductSchema, UpdateProductSchema } from '../validation/schemas';

export const productRouter = Router();

productRouter.get('/featured', ProductController.getFeaturedProducts);
productRouter.get('/vendor/:vendorId', ProductController.getProductsByVendor);
productRouter.get('/:id', ProductController.getProductById);
productRouter.post('/', authenticate, requireVendorOrAdmin, validate(CreateProductSchema), ProductController.createProduct);
productRouter.patch('/:id', authenticate, requireVendorOrAdmin, validate(UpdateProductSchema), ProductController.updateProduct);
productRouter.delete('/:id', authenticate, requireVendorOrAdmin, ProductController.deleteProduct);
