import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../qemu-manager.db');

class DatabaseService {
  constructor() {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeSchema();
  }

  initializeSchema() {
    // VMs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        cpus INTEGER NOT NULL,
        memory INTEGER NOT NULL,
        status TEXT DEFAULT 'stopped',
        vnc_port INTEGER,
        iso TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT
      )
    `);

    // Disks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS disks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        path TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL,
        format TEXT NOT NULL,
        status TEXT DEFAULT 'ready',
        uploaded_at TEXT NOT NULL
      )
    `);

    // VM Disks association (many-to-many)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vm_disks (
        vm_id TEXT NOT NULL,
        disk_path TEXT NOT NULL,
        PRIMARY KEY (vm_id, disk_path),
        FOREIGN KEY (vm_id) REFERENCES vms(id) ON DELETE CASCADE
      )
    `);

    // ISOs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS isos (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        path TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL,
        uploaded_at TEXT NOT NULL
      )
    `);

    console.log('✅ Database schema initialized');
  }

  // ===== VMs =====
  insertVM(vm) {
    const stmt = this.db.prepare(`
      INSERT INTO vms (id, name, cpus, memory, status, vnc_port, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(vm.id, vm.name, vm.cpus, vm.memory, vm.status, vm.vnc_port, vm.createdAt);
  }

  updateVMStatus(vmId, status, startedAt = null) {
    const stmt = this.db.prepare(`
      UPDATE vms SET status = ?, started_at = ? WHERE id = ?
    `);
    stmt.run(status, startedAt, vmId);
  }

  updateVMISO(vmId, isoPath) {
    const stmt = this.db.prepare(`
      UPDATE vms SET iso = ? WHERE id = ?
    `);
    stmt.run(isoPath, vmId);
  }

  updateVMResources(vmId, cpus, memory) {
    const stmt = this.db.prepare(`
      UPDATE vms SET cpus = ?, memory = ? WHERE id = ?
    `);
    stmt.run(cpus, memory, vmId);
  }

  getVM(vmId) {
    const stmt = this.db.prepare('SELECT * FROM vms WHERE id = ?');
    return stmt.get(vmId);
  }

  getAllVMs() {
    const stmt = this.db.prepare('SELECT * FROM vms ORDER BY created_at DESC');
    return stmt.all();
  }

  deleteVM(vmId) {
    const deleteDisksStmt = this.db.prepare('DELETE FROM vm_disks WHERE vm_id = ?');
    const deleteVMStmt = this.db.prepare('DELETE FROM vms WHERE id = ?');
    deleteDisksStmt.run(vmId);
    deleteVMStmt.run(vmId);
  }

  // ===== VM Disks =====
  attachDiskToVM(vmId, diskPath) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO vm_disks (vm_id, disk_path) VALUES (?, ?)
    `);
    stmt.run(vmId, diskPath);
  }

  detachDiskFromVM(vmId, diskPath) {
    const stmt = this.db.prepare(`
      DELETE FROM vm_disks WHERE vm_id = ? AND disk_path = ?
    `);
    stmt.run(vmId, diskPath);
  }

  getVMDisks(vmId) {
    const stmt = this.db.prepare(`
      SELECT disk_path as path FROM vm_disks WHERE vm_id = ?
    `);
    return stmt.all(vmId);
  }

  // ===== Disks =====
  insertDisk(disk) {
    const stmt = this.db.prepare(`
      INSERT INTO disks (id, name, path, size, format, status, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(disk.id, disk.name, disk.path, disk.size, disk.format, disk.status, disk.uploadedAt);
  }

  getAllDisks() {
    const stmt = this.db.prepare('SELECT * FROM disks ORDER BY uploaded_at DESC');
    return stmt.all();
  }

  getDisk(diskId) {
    const stmt = this.db.prepare('SELECT * FROM disks WHERE id = ?');
    return stmt.get(diskId);
  }

  deleteDisk(diskId) {
    const stmt = this.db.prepare('DELETE FROM disks WHERE id = ?');
    stmt.run(diskId);
  }

  // ===== ISOs =====
  insertISO(iso) {
    const stmt = this.db.prepare(`
      INSERT INTO isos (id, name, path, size, uploaded_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(iso.id, iso.name, iso.path, iso.size, iso.uploadedAt);
  }

  getAllISOs() {
    const stmt = this.db.prepare('SELECT * FROM isos ORDER BY uploaded_at DESC');
    return stmt.all();
  }

  getISO(isoId) {
    const stmt = this.db.prepare('SELECT * FROM isos WHERE id = ?');
    return stmt.get(isoId);
  }

  deleteISO(isoId) {
    const stmt = this.db.prepare('DELETE FROM isos WHERE id = ?');
    stmt.run(isoId);
  }

  getISOByPath(isoPath) {
    const stmt = this.db.prepare('SELECT * FROM isos WHERE path = ?');
    return stmt.get(isoPath);
  }

  close() {
    this.db.close();
  }
}

export default new DatabaseService();
