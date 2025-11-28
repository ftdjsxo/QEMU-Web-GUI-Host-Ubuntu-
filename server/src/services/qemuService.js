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
      console.log(`🖥️ Caricate ${vms.length} VM dal database`);
      
      // Sincronizza lo stato: se una VM è marcata "running" ma il processo non esiste, marcala come "stopped"
      vms.forEach(vm => {
        if (vm.status === 'running' && vm.pid) {
          // Controlla se il processo esiste ancora
          try {
            // Usa process.kill con signal 0 per testare se il processo esiste
            process.kill(vm.pid, 0);
            console.log(`✅ VM ${vm.name} è effettivamente in esecuzione (PID: ${vm.pid})`);
          } catch (e) {
            // Il processo non esiste più
            console.log(`⚠️ VM ${vm.name} era running ma il processo ${vm.pid} non esiste. Marco come stopped.`);
            db.updateVMStatus(vm.id, 'stopped');
            db.updateVMPID(vm.id, null);
          }
        } else if (vm.status === 'running' && !vm.pid) {
          // VM marcata running ma senza PID -> è stata killata
          console.log(`⚠️ VM ${vm.name} era running ma no PID salvato. Marco come stopped.`);
          db.updateVMStatus(vm.id, 'stopped');
        }
      });
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

    // 🎯 IMPORTANTE: Aggiungi i dischi allegati alla VM prima di buildare il comando QEMU
    vm.disks = db.getVMDisks(vmId).map(d => ({ path: d.path }));

    // Build QEMU arguments
    const qemuArgs = this.buildQemuCommand(vm);
    const qemuCmdString = this.buildQemuCommandString(vm);
    
    try {
      // Lancia QEMU direttamente, non tramite bash
      const qemuProcess = spawn(process.env.QEMU_BIN || '/usr/bin/qemu-system-x86_64', qemuArgs);
      
      this.processes.set(vmId, {
        process: qemuProcess,
        pid: qemuProcess.pid
      });
      
      qemuProcess.on('error', (err) => {
        console.error(`❌ QEMU process error for ${vmId}:`, err);
        db.updateVMStatus(vmId, 'stopped');
      });

      qemuProcess.on('close', (code) => {
        console.log(`🛑 QEMU process for ${vmId} closed with code ${code}`);
        db.updateVMStatus(vmId, 'stopped');
        this.processes.delete(vmId);
      });

      // Log stdout/stderr di QEMU
      qemuProcess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) console.log(`[${vmId}] ${output}`);
      });

      qemuProcess.stderr?.on('data', (data) => {
        const output = data.toString().trim();
        if (output) console.warn(`[${vmId}] ${output}`);
      });

      const startedAt = new Date().toISOString();
      db.updateVMStatus(vmId, 'running', startedAt);
      db.updateVMPID(vmId, qemuProcess.pid); // Salva il PID nel database
      
      const updatedVm = db.getVM(vmId);
      console.log(`✅ VM ${vm.name} (${vmId}) started with PID ${qemuProcess.pid}`);
      console.log(`💾 Dischi allegati: ${vm.disks.length > 0 ? vm.disks.map(d => d.path).join(', ') : 'nessuno'}`);
      return { vm: updatedVm, command: qemuCmdString, pid: qemuProcess.pid };
    } catch (error) {
      throw new Error(`Failed to start VM: ${error.message}`);
    }
  }

  async stopVM(vmId) {
    const vm = db.getVM(vmId);
    if (!vm) {
      throw new Error(`VM ${vmId} not found`);
    }

    const processInfo = this.processes.get(vmId);
    if (processInfo) {
      try {
        // Prima prova a killare il processo
        process.kill(processInfo.pid, 'SIGTERM');
        console.log(`📤 Sent SIGTERM to VM ${vmId} (PID: ${processInfo.pid})`);
        
        // Aspetta un po' che si fermi
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Se è ancora vivo, forza SIGKILL
        try {
          process.kill(processInfo.pid, 0); // Test se il processo esiste
          process.kill(processInfo.pid, 'SIGKILL');
          console.log(`🔴 Sent SIGKILL to VM ${vmId} (PID: ${processInfo.pid})`);
        } catch (e) {
          // Processo già morto
          console.log(`✅ VM ${vmId} stopped gracefully`);
        }
      } catch (error) {
        console.error(`Error stopping VM ${vmId}:`, error.message);
      }
      
      this.processes.delete(vmId);
    }

    db.updateVMStatus(vmId, 'stopped');
    console.log(`🛑 VM ${vm.name} marked as stopped`);
    
    return { message: 'VM stopped successfully' };
  }

  // Parse QEMU command string into array of arguments
  parseQemuArgs(qemuCmd) {
    // Rimuovi il percorso di qemu-system-x86_64 dall'inizio
    const args = [];
    const parts = qemuCmd.split(/\s+/);
    
    // Skip qemu-system-x86_64
    for (let i = 1; i < parts.length; i++) {
      let arg = parts[i];
      
      // Gestisci gli argomenti con quote
      if (arg.startsWith('"') && !arg.endsWith('"')) {
        // Accumula le parti finché non trovo la chiusura
        let j = i;
        while (j < parts.length && !parts[j].endsWith('"')) {
          j++;
        }
        if (j < parts.length) {
          arg = parts.slice(i, j + 1).join(' ').replace(/"/g, '');
          i = j;
        }
      } else {
        arg = arg.replace(/"/g, '');
      }
      
      if (arg.trim()) args.push(arg.trim());
    }
    
    return args;
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
    const args = [];
    
    args.push(`-m`, `${vm.memory}`);
    args.push(`-smp`, `${vm.cpus}`);
    args.push(`-name`, vm.name);
    args.push(`-vnc`, `127.0.0.1:${vm.vnc_port - 5900}`);
    args.push(`-monitor`, `stdio`);
    args.push(`-enable-kvm`);
    
    // Aggiungi dischi usando controller IDE (universalmente compatibile)
    if (vm.disks && vm.disks.length > 0) {
      vm.disks.forEach((disk, index) => {
        if (index < 4) {
          args.push(`-drive`);
          args.push(`file=${disk.path},format=qcow2,if=ide,index=${index}`);
        }
      });
    }

    // Aggiungi ISO come cdrom secondario
    if (vm.iso) {
      args.push(`-cdrom`, vm.iso);
    }

    // Imposta boot order
    if (vm.disks && vm.disks.length > 0) {
      args.push(`-boot`, `c`); // Boot da hard disk
    } else if (vm.iso) {
      args.push(`-boot`, `d`); // Boot da cdrom
    }

    return args;
  }

  // Costruisci il comando QEMU come stringa (per logging)
  buildQemuCommandString(vm) {
    const qemuBin = process.env.QEMU_BIN || '/usr/bin/qemu-system-x86_64';
    const args = this.buildQemuCommand(vm);
    return qemuBin + ' ' + args.map(arg => {
      if (arg.includes(' ')) return `"${arg}"`;
      return arg;
    }).join(' ');
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
