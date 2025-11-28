import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as isoController from '../controllers/isoController.js';

const router = express.Router();

// Configure multer for ISO uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isoPath = process.env.ISO_STORAGE_PATH || '/tmp/qemu-isos';
    cb(null, isoPath);
  },
  filename: (req, file, cb) => {
    // Keep original filename but sanitize it
    const filename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow ISO files
  if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.iso')) {
    cb(null, true);
  } else {
    cb(new Error('Only ISO files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_ISO_SIZE || 5368709120), // 5GB default
  },
});

router.get('/', isoController.listISOs);
router.post('/upload', upload.single('file'), isoController.uploadISO);
router.get('/:id', isoController.getISO);
router.delete('/:id', isoController.deleteISO);

export default router;
