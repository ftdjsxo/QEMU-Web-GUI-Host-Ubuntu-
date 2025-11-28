import React, { useState, useEffect } from 'react';
import { Disc3, Trash2, RefreshCw, Upload, X } from 'lucide-react';
import { isoAPI } from '../services/api';

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function ISOList() {
  const [isos, setISOs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = React.useRef(null);

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

    setShowUploadModal(true);
    setUploadFileName(file.name);
    setUploadProgress(0);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setISOs([...isos, response.iso]);
          setUploadProgress(100);
          setTimeout(() => {
            setShowUploadModal(false);
            setUploading(false);
            fileInputRef.current.value = '';
          }, 1500);
        }
      });

      xhr.addEventListener('error', () => {
        alert('Errore durante il caricamento');
        setShowUploadModal(false);
        setUploading(false);
      });

      xhr.open('POST', '/api/isos/upload');
      xhr.send(formData);
    } catch (error) {
      alert('Errore: ' + error.message);
      setShowUploadModal(false);
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary flex items-center gap-2"
            disabled={uploading}
          >
            <Upload size={18} />
            Carica ISO
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".iso"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Upload Progress Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Caricamento ISO</h3>
              {!uploading && (
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">File: {uploadFileName}</p>
                <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-full transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-right text-sm text-gray-300 mt-2">{uploadProgress}%</p>
              </div>

              {uploadProgress === 100 && (
                <div className="bg-green-900 border border-green-600 rounded-lg p-3 text-center">
                  <p className="text-green-300 font-semibold">✅ Caricamento completato!</p>
                </div>
              )}

              {uploading && (
                <p className="text-sm text-gray-400 text-center animate-pulse">
                  Caricamento in corso...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ISO List */}
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
