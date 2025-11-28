import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

const execAsync = promisify(exec);

class QemuService {
  constructor() {
    this.processes = new Map();
    this.vmsStoragePath = process.env.VMS_STORAGE_PATH || '/tmp/qemu-vms';
    this.ensureStoragePath();
    this.loadVMsFromDB();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.vmsStoragePath)) {
      fs.mkdirSync(this.vmsStoragePath, { recursive: true });
    }
  }

  loadVMsFromDB() {
    try {
      const vms = db.getAllVMs();
      console.log(`🖥️  Caricate ${vms.length} VM dal database`);
    } catch (error) {
      console.warn('Error loading VMs from DB:', error.message);
    }
  }

  async listVMs() {
    try {
      const vms = db.getAllVMs();
      // Arricchisci con i dischi allegati
      return vms.map(vm => ({
        ...vm,
        disks: db.getVMDisks(vm.id).map(d => ({ path: d.path })),
      }));
    } catch (error) {
      console.error('Error listing VMs:', error);
      return [];
    }
  }

  async createVM(config) {
    const vm = {
      id: uuidv4(),
      name: config.name,
      memory: config.memory || 2048, // MB
      cpus: config.cpus || 2,
      status: 'stopped',
      createdAt: new Date().toISOString(),
      vnc_port: 5900 + Math.floor(Math.random() * 100),
      iso: null,
    };

    db.insertVM(vm);
    return vm;
  }

  async deleteVM(vmId) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      await this.stopVM(vmId);
    }

    db.deleteVM(vmId);
    return { message: 'VM deleted successfully' };
  }

  async startVM(vmId) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('VM is already running');
    }

    // Build QEMU command
    const qemuCmd = this.buildQemuCommand(vm);
    
    try {
      const process = spawn('bash', ['-c', qemuCmd]);
      this.processes.set(vmId, process);
      
      process.on('error', (err) => {
        console.error(`QEMU process error for ${vmId}:`, err);
        db.updateVMStatus(vmId, 'stopped');
      });

      process.on('close', (code) => {
        console.log(`QEMU process for ${vmId} closed with code ${code}`);
        db.updateVMStatus(vmId, 'stopped');
        this.processes.delete(vmId);
      });

      const startedAt = new Date().toISOString();
      db.updateVMStatus(vmId, 'running', startedAt);
      
      const vm = db.getVM(vmId);
      return { vm, command: qemuCmd };
    } catch (error) {
      throw new Error(`Failed to start VM: ${error.message}`);
    }
  }

  async stopVM(vmId) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    const process = this.processes.get(vmId);
    if (process) {
      process.kill('SIGTERM');
      this.processes.delete(vmId);
    }

    db.updateVMStatus(vmId, 'stopped');
    
    return { message: 'VM stopped successfully' };
  }

  async updateVMResources(vmId, config) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('Cannot modify resources while VM is running');
    }

    if (config.memory) db.updateVMResources(vmId, config.cpus || config.cpus, config.memory);
    if (config.cpus) db.updateVMResources(vmId, config.cpus, config.memory || vm.memory);

    return db.getVM(vmId);
  }

  async attachDisk(vmId, diskPath) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('Cannot attach disk while VM is running');
    }

    db.attachDiskToVM(vmId, diskPath);
    
    const updatedVM = db.getVM(vmId);
    updatedVM.disks = db.getVMDisks(vmId).map(d => ({ path: d.path }));
    return updatedVM;
  }

  async detachDisk(vmId, diskPath) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('Cannot detach disk while VM is running');
    }

    db.detachDiskFromVM(vmId, diskPath);
    
    const updatedVM = db.getVM(vmId);
    updatedVM.disks = db.getVMDisks(vmId).map(d => ({ path: d.path }));
    return updatedVM;
  }

  async mountISO(vmId, isoPath) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    db.updateVMISO(vmId, isoPath);
    return vm;
  }

  async unmountISO(vmId) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    db.updateVMISO(vmId, null);
    return db.getVM(vmId);
  }

  buildQemuCommand(vm) {
    const qemuBin = process.env.QEMU_BIN || '/usr/bin/qemu-system-x86_64';
    
    let cmd = `${qemuBin}`;
    cmd += ` -m ${vm.memory}`;
    cmd += ` -smp ${vm.cpus}`;
    cmd += ` -name "${vm.name}"`;
    cmd += ` -vnc 127.0.0.1:${vm.vnc_port - 5900}`;
    cmd += ` -monitor stdio`;
    
    // Aggiungi dischi
    if (vm.disks && vm.disks.length > 0) {
      vm.disks.forEach((disk, index) => {
        cmd += ` -drive file="${disk.path}",format=qcow2,if=virtio`;
      });
    }

    // Aggiungi ISO
    if (vm.iso) {
      cmd += ` -cdrom "${vm.iso}"`;
    }

    return cmd;
  }

  getVMDetails(vmId) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }
    return vm;
  }
}

export default new QemuService();
