/**
 * Search Routes
 *
 * GET /api/v1/search/tags — public default/trending search tags
 * GET /api/v1/search?q=query — search shops and products
 */

import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

export const searchRouter = Router();

searchRouter.get('/tags', SearchController.getTags);
searchRouter.get('/', SearchController.search);
