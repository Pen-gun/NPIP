import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { downloadReport } from '../controllers/report.controller.js';

const router = Router();

router.use(verifyJWT);
router.get('/:id/pdf', downloadReport);

export default router;
