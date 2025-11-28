import React, { useState, useEffect } from 'react';
import { Play, Square, Trash2, Plus, RefreshCw, Settings } from 'lucide-react';
import { vmAPI } from '../services/api';
import VMDetailsModal from './VMDetailsModal';

export default function VMList() {
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVM, setSelectedVM] = useState(null);
  const [newVM, setNewVM] = useState({ name: '', cpus: 2, memory: 2048 });

  useEffect(() => {
    loadVMs();
  }, []);

  async function loadVMs() {
    setLoading(true);
    try {
      const response = await vmAPI.list();
      setVms(response.data.vms);
    } catch (error) {
      console.error('Error loading VMs:', error);
    }
    setLoading(false);
  }

  async function createVM() {
    try {
      const response = await vmAPI.create(newVM);
      setVms([...vms, response.data.vm]);
      setNewVM({ name: '', cpus: 2, memory: 2048 });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating VM:', error);
    }
  }

  async function startVM(id) {
    try {
      const response = await vmAPI.start(id);
      const updatedVMs = vms.map(vm => vm.id === id ? { ...vm, status: 'running' } : vm);
      setVms(updatedVMs);
      if (selectedVM && selectedVM.id === id) {
        setSelectedVM({ ...selectedVM, status: 'running' });
      }
    } catch (error) {
      console.error('Error starting VM:', error);
    }
  }

  async function stopVM(id) {
    try {
      await vmAPI.stop(id);
      const updatedVMs = vms.map(vm => vm.id === id ? { ...vm, status: 'stopped' } : vm);
      setVms(updatedVMs);
      if (selectedVM && selectedVM.id === id) {
        setSelectedVM({ ...selectedVM, status: 'stopped' });
      }
    } catch (error) {
      console.error('Error stopping VM:', error);
    }
  }

  async function deleteVM(id) {
    if (confirm('Are you sure?')) {
      try {
        await vmAPI.delete(id);
        setVms(vms.filter(vm => vm.id !== id));
        if (selectedVM && selectedVM.id === id) {
          setSelectedVM(null);
        }
      } catch (error) {
        console.error('Error deleting VM:', error);
      }
    }
  }

  function updateSelectedVM(updatedVM) {
    setSelectedVM(updatedVM);
    const updatedVMs = vms.map(vm => vm.id === updatedVM.id ? updatedVM : vm);
    setVms(updatedVMs);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Virtual Machines</h2>
        <div className="flex gap-2">
          <button
            onClick={loadVMs}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            New VM
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New VM</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">VM Name</label>
                <input
                  type="text"
                  className="input w-full"
                  value={newVM.name}
                  onChange={(e) => setNewVM({ ...newVM, name: e.target.value })}
                  placeholder="e.g., ubuntu-20.04"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">CPUs</label>
                  <input
                    type="number"
                    className="input w-full"
                    min="1"
                    max="16"
                    value={newVM.cpus}
                    onChange={(e) => setNewVM({ ...newVM, cpus: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">RAM (MB)</label>
                  <input
                    type="number"
                    className="input w-full"
                    min="512"
                    value={newVM.memory}
                    onChange={(e) => setNewVM({ ...newVM, memory: parseInt(e.target.value) })}
                  />
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
                  onClick={createVM}
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
          <p className="text-gray-400">Loading VMs...</p>
        ) : vms.length === 0 ? (
          <p className="text-gray-400">No VMs yet. Create one to get started.</p>
        ) : (
          vms.map((vm) => (
            <div key={vm.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => setSelectedVM(vm)}>
                  <h3 className="text-xl font-bold hover:text-blue-400">{vm.name}</h3>
                  <div className="text-sm text-gray-400 mt-2 grid grid-cols-4 gap-4">
                    <span>CPUs: {vm.cpus}</span>
                    <span>RAM: {vm.memory}MB</span>
                    <span className={`font-medium ${vm.status === 'running' ? 'text-green-400' : 'text-red-400'}`}>
                      {vm.status.toUpperCase()}
                    </span>
                    <span>Dischi: {vm.disks?.length || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedVM(vm)}
                    className="btn btn-secondary flex items-center gap-2"
                    title="Dettagli e gestione"
                  >
                    <Settings size={18} />
                  </button>
                  {vm.status === 'stopped' ? (
                    <button
                      onClick={() => startVM(vm.id)}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      <Play size={18} />
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => stopVM(vm.id)}
                      className="btn btn-secondary flex items-center gap-2"
                    >
                      <Square size={18} />
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => deleteVM(vm.id)}
                    className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedVM && (
        <VMDetailsModal
          vm={selectedVM}
          onClose={() => setSelectedVM(null)}
          onUpdate={updateSelectedVM}
        />
      )}
    </div>
  );
}
