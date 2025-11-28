import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

class QemuService {
  constructor() {
    this.vms = new Map();
    this.processes = new Map();
    this.vmsStoragePath = process.env.VMS_STORAGE_PATH || '/tmp/qemu-vms';
    this.ensureStoragePath();
  }

  ensureStoragePath() {
    if (!fs.existsSync(this.vmsStoragePath)) {
      fs.mkdirSync(this.vmsStoragePath, { recursive: true });
    }
  }

  async listVMs() {
    try {
      const result = await execAsync('virsh list --all 2>/dev/null || echo "[]"');
      // Parse virsh output or fallback to our internal tracking
      return Array.from(this.vms.values());
    } catch (error) {
      console.error('Error listing VMs:', error);
      return Array.from(this.vms.values());
    }
  }

  async createVM(config) {
    const vm = {
      id: uuidv4(),
      name: config.name,
      memory: config.memory || 2048, // MB
      cpus: config.cpus || 2,
      disk: config.disk || 20, // GB
      iso: config.iso || null,
      status: 'stopped',
      createdAt: new Date().toISOString(),
      vnc_port: 5900 + Math.floor(Math.random() * 100),
      disks: [],
    };

    this.vms.set(vm.id, vm);
    return vm;
  }

  async deleteVM(vmId) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      await this.stopVM(vmId);
    }

    this.vms.delete(vmId);
    return { message: 'VM deleted successfully' };
  }

  async startVM(vmId) {
    const vm = this.vms.get(vmId);
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
        vm.status = 'stopped';
      });

      process.on('close', (code) => {
        console.log(`QEMU process for ${vmId} closed with code ${code}`);
        vm.status = 'stopped';
        this.processes.delete(vmId);
      });

      vm.status = 'running';
      vm.startedAt = new Date().toISOString();
      
      return { vm, command: qemuCmd };
    } catch (error) {
      throw new Error(`Failed to start VM: ${error.message}`);
    }
  }

  async stopVM(vmId) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    const process = this.processes.get(vmId);
    if (process) {
      process.kill('SIGTERM');
      this.processes.delete(vmId);
    }

    vm.status = 'stopped';
    vm.stoppedAt = new Date().toISOString();
    
    return { message: 'VM stopped successfully' };
  }

  async updateVMResources(vmId, config) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('Cannot modify resources while VM is running');
    }

    if (config.memory) vm.memory = config.memory;
    if (config.cpus) vm.cpus = config.cpus;

    return vm;
  }

  async attachDisk(vmId, diskPath) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('Cannot attach disk while VM is running');
    }

    if (!vm.disks) {
      vm.disks = [];
    }

    vm.disks.push({
      path: diskPath,
      attachedAt: new Date().toISOString(),
    });

    return vm;
  }

  async detachDisk(vmId, diskPath) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    if (vm.status === 'running') {
      throw new Error('Cannot detach disk while VM is running');
    }

    vm.disks = vm.disks.filter(d => d.path !== diskPath);
    return vm;
  }

  async mountISO(vmId, isoPath) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    vm.iso = isoPath;
    return vm;
  }

  async unmountISO(vmId) {
    const vm = this.vms.get(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    vm.iso = null;
    return vm;
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
