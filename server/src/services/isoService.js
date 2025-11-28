import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class ISOService {
  constructor() {
    this.isos = new Map();
    this.isoStoragePath = process.env.ISO_STORAGE_PATH || '/tmp/qemu-isos';
    this.ensureStoragePath();
    this.scanISOs();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.isoStoragePath)) {
      fs.mkdirSync(this.isoStoragePath, { recursive: true });
    }
  }

  scanISOs() {
    try {
      if (!fs.existsSync(this.isoStoragePath)) {
        return;
      }

      const files = fs.readdirSync(this.isoStoragePath);
      files.forEach(file => {
        if (file.endsWith('.iso')) {
          const filePath = path.join(this.isoStoragePath, file);
          const stats = fs.statSync(filePath);
          const iso = {
            id: uuidv4(),
            name: file,
            path: filePath,
            size: stats.size,
            uploadedAt: new Date(stats.birthtimeMs).toISOString(),
          };
          this.isos.set(iso.id, iso);
        }
      });
    } catch (error) {
      console.error('Error scanning ISOs:', error);
    }
  }

  async uploadISO(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    const iso = {
      id: uuidv4(),
      name: file.originalname,
      path: file.path,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };

    this.isos.set(iso.id, iso);
    return iso;
  }

  async listISOs() {
    return Array.from(this.isos.values());
  }

  async getISO(isoId) {
    const iso = this.isos.get(isoId);
    if (!iso) {
      throw new Error(`ISO ${isoId} not found`);
    }
    return iso;
  }

  async deleteISO(isoId) {
    const iso = this.isos.get(isoId);
    if (!iso) {
      throw new Error(`ISO ${isoId} not found`);
    }

    try {
      if (fs.existsSync(iso.path)) {
        fs.unlinkSync(iso.path);
      }
    } catch (error) {
      console.error('Error deleting ISO file:', error);
    }

    this.isos.delete(isoId);
    return { message: 'ISO deleted successfully' };
  }

  getISOPath(isoId) {
    const iso = this.isos.get(isoId);
    if (!iso) {
      return null;
    }
    return iso.path;
  }
}

export default new ISOService();
