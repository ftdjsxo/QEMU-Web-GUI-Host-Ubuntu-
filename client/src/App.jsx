import React, { useState } from 'react';
import { Monitor, HardDrive, Disc3 } from 'lucide-react';
import VMList from './components/VMList';
import DiskList from './components/DiskList';
import ISOList from './components/ISOList';
import './index.css';

export default function App() {
  const [currentPage, setCurrentPage] = useState('vms');

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
            <Monitor size={28} />
            QEMU Manager
          </h1>
          <p className="text-sm text-gray-400 mt-2">Virtual Machine Control Panel</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setCurrentPage('vms')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
              currentPage === 'vms'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Monitor size={20} />
            Virtual Machines
          </button>
          <button
            onClick={() => setCurrentPage('disks')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
              currentPage === 'disks'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <HardDrive size={20} />
            Virtual Disks
          </button>
          <button
            onClick={() => setCurrentPage('isos')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
              currentPage === 'isos'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Disc3 size={20} />
            ISO Files
          </button>
        </nav>

        <div className="border-t border-gray-700 pt-4">
          <p className="text-xs text-gray-500">
            Built with React & Express<br />
            QEMU Manager v1.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {currentPage === 'vms' && <VMList />}
          {currentPage === 'disks' && <DiskList />}
          {currentPage === 'isos' && <ISOList />}
        </div>
      </main>
    </div>
  );
}
