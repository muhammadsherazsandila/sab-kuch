import { Router } from 'express';
import { BannerController } from '../controllers/banner.controller';

export const bannerRouter = Router();

bannerRouter.get('/', BannerController.listPublicBanners);
