import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import {
    listAdminPages,
    getAdminPage,
    updateAdminPage,
    listAdminMedia,
    uploadAdminMedia,
    deleteAdminMedia,
} from '../controllers/adminCms.controller.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `admin-${timestamp}-${random}${ext}`);
    },
});

const upload = multer({ storage });

router.use(verifyJWT, requireAdmin);

router.get('/pages', listAdminPages);
router.get('/pages/:id', getAdminPage);
router.put('/pages/:id', updateAdminPage);

router.get('/media', listAdminMedia);
router.post('/media', upload.single('file'), uploadAdminMedia);
router.delete('/media/:id', deleteAdminMedia);

export default router;
