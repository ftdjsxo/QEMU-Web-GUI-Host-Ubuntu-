import React, { useState, useEffect } from 'react';
import { Disc3, Trash2, Plus, RefreshCw, Upload } from 'lucide-react';
import { isoAPI } from '../services/api';

export default function ISOList() {
  const [isos, setISOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileInput, setFileInput] = useState(null);

  useEffect(() => {
    loadISOs();
  }, []);

  async function loadISOs() {
    setLoading(true);
    try {
      const response = await isoAPI.list();
      setISOs(response.data.isos || []);
    } catch (error) {
      console.error('Error loading ISOs:', error);
    }
    setLoading(false);
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.iso')) {
      alert('Per favore seleziona un file ISO');
      return;
    }

    setUploading(true);
    try {
      const response = await isoAPI.upload(file);
      setISOs([...isos, response.data.iso]);
      alert('ISO caricato con successo!');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading ISO:', error);
      alert('Errore durante il caricamento: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteISO(isoId) {
    if (!confirm('Eliminare questa ISO?')) return;

    try {
      await isoAPI.delete(isoId);
      setISOs(isos.filter(iso => iso.id !== isoId));
      alert('ISO eliminato con successo');
    } catch (error) {
      console.error('Error deleting ISO:', error);
      alert('Errore durante l\'eliminazione');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">ISO Files</h2>
        <div className="flex gap-2">
          <button
            onClick={loadISOs}
            className="btn btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={18} />
            Aggiorna
          </button>
          <label className="btn btn-primary flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            Carica ISO
            <input
              ref={el => setFileInput(el)}
              type="file"
              accept=".iso"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
          <p className="text-sm text-blue-200">📤 Upload in corso...</p>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <p className="text-gray-400">Caricamento ISO...</p>
        ) : isos.length === 0 ? (
          <p className="text-gray-400">Nessuna ISO disponibile. Caricane una per iniziare.</p>
        ) : (
          isos.map((iso) => (
            <div key={iso.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Disc3 size={32} className="text-purple-400" />
                  <div>
                    <h3 className="text-lg font-bold">{iso.name}</h3>
                    <div className="text-sm text-gray-400 mt-1 space-y-1">
                      <p>Dimensione: {formatBytes(iso.size)}</p>
                      <p>Caricato: {new Date(iso.uploadedAt).toLocaleString('it-IT')}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteISO(iso.id)}
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
