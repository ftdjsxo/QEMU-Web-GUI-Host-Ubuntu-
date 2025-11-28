import React, { useState, useEffect } from 'react';
import { X, Play, Square, Plus, Trash2, Monitor, HardDrive, Disc3 } from 'lucide-react';
import { vmAPI, diskAPI, isoAPI } from '../services/api';
import VNCConsole from './VNCConsole';

export default function VMDetailsModal({ vm, onClose, onUpdate }) {
  const [showVNC, setShowVNC] = useState(false);
  const [availableDisks, setAvailableDisks] = useState([]);
  const [availableISOs, setAvailableISOs] = useState([]);
  const [selectedDiskPath, setSelectedDiskPath] = useState('');
  const [selectedISOId, setSelectedISOId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableResources();
  }, []);

  async function loadAvailableResources() {
    try {
      const disksResponse = await diskAPI.list();
      setAvailableDisks(disksResponse.data.disks || []);

      const isosResponse = await isoAPI.list();
      setAvailableISOs(isosResponse.data.isos || []);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  }

  async function attachDisk() {
    if (!selectedDiskPath) {
      alert('Seleziona un disco');
      return;
    }
    try {
      setLoading(true);
      const response = await vmAPI.attachDisk(vm.id, selectedDiskPath);
      onUpdate(response.data.vm);
      setSelectedDiskPath('');
      alert('Disco allegato con successo');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function detachDisk(diskPath) {
    if (!confirm('Rimuovere il disco?')) return;
    try {
      setLoading(true);
      const response = await vmAPI.detachDisk(vm.id, diskPath);
      onUpdate(response.data.vm);
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function mountISO() {
    if (!selectedISOId) {
      alert('Seleziona una ISO');
      return;
    }

    const selectedISO = availableISOs.find(iso => iso.id === selectedISOId);
    if (!selectedISO) {
      alert('ISO non trovata');
      return;
    }

    try {
      setLoading(true);
      const response = await vmAPI.mountISO(vm.id, selectedISO.path);
      onUpdate(response.data.vm);
      setSelectedISOId('');
      alert('ISO montata con successo');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function unmountISO() {
    if (!confirm('Smontare ISO?')) return;
    try {
      setLoading(true);
      const response = await vmAPI.unmountISO(vm.id);
      onUpdate(response.data.vm);
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-gray-800 pb-4">
            <h2 className="text-3xl font-bold">{vm.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={28} />
            </button>
          </div>

          {/* Status Section */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className={`text-lg font-bold ${vm.status === 'running' ? 'text-green-400' : 'text-red-400'}`}>
                  {vm.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">CPUs</p>
                <p className="text-lg font-bold">{vm.cpus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">RAM</p>
                <p className="text-lg font-bold">{vm.memory}MB</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">VNC Port</p>
                <p className="text-lg font-bold">:{vm.vnc_port - 5900}</p>
              </div>
            </div>

            {vm.status === 'running' && (
              <button
                onClick={() => setShowVNC(true)}
                className="w-full btn btn-primary flex items-center justify-center gap-2 py-3"
              >
                <Monitor size={20} />
                Apri Console VNC
              </button>
            )}
          </div>

          {/* ISO Section */}
          <div className="border-t border-gray-700 pt-4 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Disc3 size={20} />
              ISO
            </h3>
            {vm.iso ? (
              <div className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                <span className="text-sm break-all">{vm.iso}</span>
                <button
                  onClick={unmountISO}
                  className="btn bg-red-600 hover:bg-red-700 text-white text-sm"
                  disabled={loading}
                >
                  Smonta
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {availableISOs.length === 0 ? (
                  <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 text-sm text-yellow-200">
                    📢 Nessuna ISO disponibile. Vai a "ISO Files" per caricarne una.
                  </div>
                ) : (
                  <>
                    <select
                      className="input w-full"
                      value={selectedISOId}
                      onChange={(e) => setSelectedISOId(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Seleziona una ISO</option>
                      {availableISOs.map((iso) => (
                        <option key={iso.id} value={iso.id}>
                          {iso.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={mountISO}
                      className="w-full btn btn-primary"
                      disabled={loading || !selectedISOId}
                    >
                      Monta ISO
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Disks Section */}
          <div className="border-t border-gray-700 pt-4 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HardDrive size={20} />
              Dischi Allegati ({vm.disks?.length || 0})
            </h3>

            {vm.disks && vm.disks.length > 0 && (
              <div className="space-y-2 mb-4">
                {vm.disks.map((disk, idx) => (
                  <div key={idx} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                    <span className="text-sm break-all">{disk.path}</span>
                    <button
                      onClick={() => detachDisk(disk.path)}
                      className="btn bg-red-600 hover:bg-red-700 text-white text-sm"
                      disabled={loading}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {availableDisks.length === 0 ? (
                <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-3 text-sm text-yellow-200">
                  📢 Nessun disco disponibile.
                </div>
              ) : (
                <>
                  <select
                    className="input w-full"
                    value={selectedDiskPath}
                    onChange={(e) => setSelectedDiskPath(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Seleziona un disco disponibile</option>
                    {availableDisks.map((disk) => (
                      <option key={disk.id} value={disk.path}>
                        {disk.name} ({disk.size}GB)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={attachDisk}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                    disabled={loading || !selectedDiskPath}
                  >
                    <Plus size={18} />
                    Allega Disco
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-xl font-bold mb-3">Informazioni</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>ID: <span className="text-gray-200 font-mono text-xs">{vm.id}</span></p>
              <p>Creata: {new Date(vm.createdAt).toLocaleString('it-IT')}</p>
              {vm.startedAt && <p>Avviata: {new Date(vm.startedAt).toLocaleString('it-IT')}</p>}
            </div>
          </div>
        </div>
      </div>

      {showVNC && (
        <VNCConsole vmId={vm.id} vncPort={vm.vnc_port} onClose={() => setShowVNC(false)} />
      )}
    </>
  );
}
