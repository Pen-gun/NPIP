import { Router } from 'express';
import { searchFigure } from '../controllers/figure.controller.js';

const router = Router();

router.get('/search', searchFigure);

export default router;
