import { Router } from 'express';
import { getPublishedPage } from '../controllers/publicPage.controller.js';

const router = Router();

router.get('/:slug', getPublishedPage);

export default router;
