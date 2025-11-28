import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

class ISOService {
  constructor() {
    this.isoStoragePath = process.env.ISO_STORAGE_PATH || '/tmp/qemu-isos';
    this.ensureStoragePath();
    this.loadISOsFromDB();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.isoStoragePath)) {
      fs.mkdirSync(this.isoStoragePath, { recursive: true });
    }
  }

  loadISOsFromDB() {
    try {
      const isos = db.getAllISOs();
      console.log(`💿 Caricati ${isos.length} ISO dal database`);
    } catch (error) {
      console.warn('Error loading ISOs from DB:', error.message);
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

    // Save to database
    db.insertISO(iso);
    return iso;
  }

  async listISOs() {
    return db.getAllISOs();
  }

  async getISO(isoId) {
    const iso = db.getISO(isoId);
    if (!iso) {
      throw new Error(`ISO ${isoId} not found`);
    }
    return iso;
  }

  async deleteISO(isoId) {
    const iso = db.getISO(isoId);
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

    db.deleteISO(isoId);
    return { message: 'ISO deleted successfully' };
  }

  getISOPath(isoId) {
    const iso = db.getISO(isoId);
    if (!iso) {
      return null;
    }
    return iso.path;
  }
}

export default new ISOService();
