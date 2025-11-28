import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function VNCConsole({ vmId, vncPort, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const loadNoVNC = async () => {
      try {
        // Load NoVNC from CDN
        if (!window.RFB) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/novnc@1.4.0/core/rfb.js';
          script.async = true;
          script.onload = () => {
            initializeVNC();
          };
          document.head.appendChild(script);
        } else {
          initializeVNC();
        }
      } catch (error) {
        console.error('Error loading NoVNC:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p class="text-red-400">Error: NoVNC not available.</p>';
        }
      }
    };

    const initializeVNC = () => {
      if (!containerRef.current || !window.RFB) return;

      try {
        // Calcola il display number dalla porta VNC
        const displayNum = vncPort ? vncPort - 5900 : 0;
        
        // Connessione VNC locale (richiede websockify in esecuzione)
        // Per la demo, mostri la porta VNC a cui connettersi
        const rfb = new window.RFB(
          containerRef.current,
          `ws://127.0.0.1:6080/vnc/?path=?vmId=${vmId}`,
          {
            credentials: { password: '' },
          }
        );

        rfb.addEventListener('connect', () => {
          console.log('VNC connected to VM:', vmId);
        });

        rfb.addEventListener('disconnect', () => {
          console.log('VNC disconnected from VM:', vmId);
        });

        rfb.addEventListener('error', (error) => {
          console.error('VNC Error:', error);
        });
      } catch (error) {
        console.error('VNC Connection Error:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-4 text-center">
              <p class="text-red-400 mb-4">Errore: NoVNC non disponibile</p>
              <p class="text-sm text-gray-400">Per accedere alla console VNC, usa un client VNC e connettiti a:</p>
              <p class="font-mono bg-gray-800 p-2 mt-2 rounded">127.0.0.1:${vncPort}</p>
              <p class="text-xs text-gray-400 mt-4">Alternativamente, avvia websockify:</p>
              <p class="font-mono bg-gray-800 p-2 mt-2 rounded text-xs">websockify 6080 127.0.0.1:${vncPort}</p>
            </div>
          `;
        }
      }
    };

    loadNoVNC();
  }, [vmId, vncPort]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg overflow-hidden w-full max-w-4xl h-5/6 flex flex-col">
        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div>
            <h3 className="text-xl font-bold">🖥️ Console VNC - {vmId}</h3>
            <p className="text-xs text-gray-400 mt-1">Porta VNC: {vncPort}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>
        <div ref={containerRef} className="flex-1 bg-black overflow-auto" />
      </div>
    </div>
  );
}
