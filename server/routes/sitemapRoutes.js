import { Router } from 'express';
import * as sitemapController from '../controllers/sitemapController.js';

const router = Router();

router.get('/sitemap.xml', sitemapController.sitemapXml);
router.get('/robots.txt', sitemapController.robotsTxt);

export default router;