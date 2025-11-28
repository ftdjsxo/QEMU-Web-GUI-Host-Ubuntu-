import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, Plus, RefreshCw, Upload } from 'lucide-react';
import { diskAPI } from '../services/api';

export default function DiskList() {
  const [disks, setDisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDisk, setNewDisk] = useState({ name: '', size: 20, format: 'qcow2' });
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    loadDisks();
  }, []);

  async function loadDisks() {
    setLoading(true);
    try {
      const response = await diskAPI.list();
      setDisks(response.data.disks);
    } catch (error) {
      console.error('Error loading disks:', error);
    }
    setLoading(false);
  }

  async function createDisk() {
    try {
      const response = await diskAPI.create(newDisk);
      setDisks([...disks, response.data.disk]);
      setNewDisk({ name: '', size: 20, format: 'qcow2' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating disk:', error);
      alert('Error creating disk: ' + error.message);
    }
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file || !file.name.match(/\.(qcow2|raw|vmdk|vdi)$/i)) {
      alert('Per favore seleziona un file disco valido (.qcow2, .raw, .vmdk, .vdi)');
      return;
    }

    setUploading(true);
    try {
      const response = await diskAPI.upload(file);
      setDisks([...disks, response.data.disk]);
      alert('Disco caricato con successo!');
      fileInputRef.current.value = '';
    } catch (error) {
      alert('Errore durante il caricamento: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDisk(id) {
    if (confirm('Delete this disk?')) {
      try {
        await diskAPI.delete(id);
        setDisks(disks.filter(disk => disk.id !== id));
      } catch (error) {
        console.error('Error deleting disk:', error);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Virtual Disks</h2>
        <div className="flex gap-2">
          <button
            onClick={loadDisks}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary flex items-center gap-2"
            disabled={uploading}
          >
            <Upload size={18} />
            Upload Disk
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".qcow2,.raw,.vmdk,.vdi"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            New Disk
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New Disk</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Disk Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newDisk.name}
                  onChange={(e) => setNewDisk({ ...newDisk, name: e.target.value })}
                  placeholder="e.g., disk-001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Size (GB)</label>
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    value={newDisk.size}
                    onChange={(e) => setNewDisk({ ...newDisk, size: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <select
                    className="input w-full"
                    value={newDisk.format}
                    onChange={(e) => setNewDisk({ ...newDisk, format: e.target.value })}
                  >
                    <option value="qcow2">QCOW2</option>
                    <option value="raw">RAW</option>
                    <option value="vmdk">VMDK</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={createDisk}
                  className="btn btn-primary"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <p className="text-gray-400">Loading disks...</p>
        ) : disks.length === 0 ? (
          <p className="text-gray-400">No disks yet. Create one to get started.</p>
        ) : (
          disks.map((disk) => (
            <div key={disk.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <HardDrive size={32} className="text-blue-400" />
                  <div>
                    <h3 className="text-xl font-bold">{disk.name}</h3>
                    <div className="text-sm text-gray-400 mt-1 space-y-1">
                      <p>Size: {disk.size}GB | Format: {disk.format.toUpperCase()}</p>
                      <p className={`font-medium ${disk.status === 'ready' ? 'text-green-400' : disk.status === 'creating' ? 'text-yellow-400' : 'text-red-400'}`}>
                        Status: {disk.status.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteDisk(disk.id)}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
