import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

const execAsync = promisify(exec);

class DiskService {
  constructor() {
    this.disksStoragePath = process.env.DISKS_STORAGE_PATH || '/tmp/qemu-disks';
    this.ensureStoragePath();
    this.loadDisksFromDB();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.disksStoragePath)) {
      fs.mkdirSync(this.disksStoragePath, { recursive: true });
    }
  }

  loadDisksFromDB() {
    try {
      const disks = db.getAllDisks();
      console.log(`📀 Caricati ${disks.length} dischi dal database`);
    } catch (error) {
      console.warn('Error loading disks from DB:', error.message);
    }
  }

  async createDisk(config) {
    const disk = {
      id: uuidv4(),
      name: config.name,
      size: config.size || 20, // GB
      format: config.format || 'qcow2',
      path: path.join(this.disksStoragePath, `${config.name}.${config.format || 'qcow2'}`),
      createdAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
      status: 'creating',
    };

    try {
      // Create disk using qemu-img
      const qemuImgBin = process.env.QEMU_IMG_BIN || '/usr/bin/qemu-img';
      const cmd = `${qemuImgBin} create -f ${disk.format} "${disk.path}" ${disk.size}G`;
      
      await execAsync(cmd);
      
      disk.status = 'ready';
      disk.createdAtCompleted = new Date().toISOString();
      
      // Save to database
      db.insertDisk(disk);
      
      return disk;
    } catch (error) {
      disk.status = 'error';
      disk.error = error.message;
      throw new Error(`Failed to create disk: ${error.message}`);
    }
  }

  async deleteDisk(diskId) {
    const disk = db.getDisk(diskId);
    if (!disk) {
      throw new Error(`Disk ${diskId} not found`);
    }

    if (fs.existsSync(disk.path)) {
      fs.unlinkSync(disk.path);
    }

    db.deleteDisk(diskId);
    return { message: 'Disk deleted successfully' };
  }

  async listDisks() {
    return db.getAllDisks();
  }

  async getDiskInfo(diskId) {
    const disk = db.getDisk(diskId);
    if (!disk) {
      throw new Error(`Disk ${diskId} not found`);
    }

    try {
      const qemuImgBin = process.env.QEMU_IMG_BIN || '/usr/bin/qemu-img';
      const { stdout } = await execAsync(`${qemuImgBin} info "${disk.path}" --output=json`);
      const info = JSON.parse(stdout);
      
      return {
        ...disk,
        info,
      };
    } catch (error) {
      return disk;
    }
  }

  async uploadDisk(originalFilename, filePath) {
    const disk = {
      id: uuidv4(),
      name: originalFilename,
      path: filePath,
      format: originalFilename.split('.').pop().toLowerCase(),
      uploadedAt: new Date().toISOString(),
      status: 'ready',
    };

    try {
      const stats = fs.statSync(filePath);
      disk.size = Math.round(stats.size / (1024 * 1024 * 1024)); // GB
      
      // Save to database
      db.insertDisk(disk);
      
      return disk;
    } catch (error) {
      throw new Error(`Failed to upload disk: ${error.message}`);
    }
  }
}

export default new DiskService();
