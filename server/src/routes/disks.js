import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as diskController from '../controllers/diskController.js';

const router = express.Router();

// Ensure disks storage directory exists
function ensureStorageDir() {
  const diskPath = process.env.DISKS_STORAGE_PATH || '/tmp/qemu-disks';
  if (!fs.existsSync(diskPath)) {
    fs.mkdirSync(diskPath, { recursive: true });
  }
  return diskPath;
}

// Multer configuration for disk uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const diskPath = ensureStorageDir();
    cb(null, diskPath);
  },
  filename: (req, file, cb) => {
    const filename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/octet-stream' || 
        file.originalname.match(/\.(qcow2|raw|vmdk|vdi)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only disk files (.qcow2, .raw, .vmdk, .vdi) are allowed'), false);
    }
  },
  limits: { fileSize: parseInt(process.env.MAX_DISK_SIZE || 107374182400) }, // 100GB default
});

router.get('/', diskController.listDisks);
router.post('/', diskController.createDisk);
router.post('/upload', upload.single('file'), diskController.uploadDisk);
router.get('/:id', diskController.getDiskInfo);
router.delete('/:id', diskController.deleteDisk);

export default router;
