/**
 * API Router — mounts all versioned sub-routers.
 * All public routes live under /api/v1/…
 */

import { Router } from 'express';
import { authRouter } from './auth.routes';
import { vendorRouter } from './vendor.routes';
import { productRouter } from './product.routes';
import { orderRouter } from './order.routes';
import { userRouter } from './user.routes';
import { adminRouter } from './admin.routes';
import { searchRouter } from './search.routes';

export const apiRouter = Router();

const V1 = '/v1';

apiRouter.use(`${V1}/auth`, authRouter);
apiRouter.use(`${V1}/vendors`, vendorRouter);
apiRouter.use(`${V1}/products`, productRouter);
apiRouter.use(`${V1}/orders`, orderRouter);
apiRouter.use(`${V1}/users`, userRouter);
apiRouter.use(`${V1}/admin`, adminRouter);
apiRouter.use(`${V1}/search`, searchRouter);

