import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function VNCConsole({ vmId, vncPort, onClose }) {
  const iframeRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    // Costruisci l'URL con i parametri VNC
    const queryParams = new URLSearchParams({
      vmId: vmId,
      port: vncPort || '5900'
    }).toString();
    
    const vncUrl = `http://localhost:5000/vnc-viewer.html?${queryParams}`;
    
    console.log('[VNCConsole] Caricamento URL:', vncUrl);
    console.log('[VNCConsole] vmId:', vmId, 'vncPort:', vncPort);
    
    if (iframeRef.current) {
      iframeRef.current.src = vncUrl;
    }
  }, [vmId, vncPort]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg overflow-hidden w-full max-w-6xl h-5/6 flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-blue-400">🖥️ Console VNC</h3>
            <p className="text-xs text-gray-400 mt-1">
              VM: <span className="text-yellow-400 font-mono">{vmId}</span> 
              {vncPort && <span> • Porta: {vncPort}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
            title="Chiudi"
          >
            <X size={24} />
          </button>
        </div>
        <iframe
          ref={iframeRef}
          className="flex-1 bg-black"
          frameBorder="0"
          allow="fullscreen"
          title={`VNC Console for ${vmId}`}
        />
      </div>
    </div>
  );
}
