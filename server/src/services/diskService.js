import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

class DiskService {
  constructor() {
    this.disks = new Map();
    this.disksStoragePath = process.env.DISKS_STORAGE_PATH || '/tmp/qemu-disks';
    this.ensureStoragePath();
    this.scanDisks();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.disksStoragePath)) {
      fs.mkdirSync(this.disksStoragePath, { recursive: true });
    }
  }

  scanDisks() {
    try {
      const files = fs.readdirSync(this.disksStoragePath);
      files.forEach((file) => {
        if (file.match(/\.(qcow2|raw|vmdk|vdi)$/i)) {
          const diskPath = path.join(this.disksStoragePath, file);
          const stats = fs.statSync(diskPath);
          const disk = {
            id: uuidv4(),
            name: file,
            path: diskPath,
            size: Math.round(stats.size / (1024 * 1024 * 1024)), // GB
            format: file.split('.').pop().toLowerCase(),
            uploadedAt: new Date(stats.birthtime).toISOString(),
            status: 'ready',
          };
          this.disks.set(disk.id, disk);
        }
      });
    } catch (error) {
      console.warn('Error scanning disks:', error.message);
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
      status: 'creating',
    };

    this.disks.set(disk.id, disk);

    try {
      // Create disk using qemu-img
      const qemuImgBin = process.env.QEMU_IMG_BIN || '/usr/bin/qemu-img';
      const cmd = `${qemuImgBin} create -f ${disk.format} "${disk.path}" ${disk.size}G`;
      
      await execAsync(cmd);
      
      disk.status = 'ready';
      disk.createdAtCompleted = new Date().toISOString();
      
      return disk;
    } catch (error) {
      disk.status = 'error';
      disk.error = error.message;
      throw new Error(`Failed to create disk: ${error.message}`);
    }
  }

  async deleteDisk(diskId) {
    const disk = this.disks.get(diskId);
    if (!disk) {
      throw new Error(`Disk ${diskId} not found`);
    }

    if (fs.existsSync(disk.path)) {
      fs.unlinkSync(disk.path);
    }

    this.disks.delete(diskId);
    return { message: 'Disk deleted successfully' };
  }

  async listDisks() {
    return Array.from(this.disks.values());
  }

  async getDiskInfo(diskId) {
    const disk = this.disks.get(diskId);
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
      this.disks.set(disk.id, disk);
      return disk;
    } catch (error) {
      throw new Error(`Failed to upload disk: ${error.message}`);
    }
  }
}

export default new DiskService();
