# QEMU Manager - Project Setup Instructions

## Project Overview
Full-stack web application for QEMU VM management with:
- **Backend**: Node.js/Express with QEMU integration
- **Frontend**: React + Vite with Tailwind CSS
- **Features**: Create/delete/start/stop VMs, allocate resources, manage disks, mount ISOs, VNC console access

## ✅ Completed Checklist

- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

## 🚀 Running the Application

### Terminal 1 - Backend
```bash
cd /home/francesco/Documenti/qemu-manager/server
npm run dev
# Output: 🚀 QEMU Manager Server running on port 5000
```

### Terminal 2 - Frontend
```bash
cd /home/francesco/Documenti/qemu-manager/client
npm run dev
# Frontend accessible on: http://localhost:3001
```

## 📍 Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🔧 Key Features Implemented

### Virtual Machines
- ✅ Create/Delete VMs
- ✅ Start/Stop VMs
- ✅ Configure CPU and RAM
- ✅ Attach/Detach virtual disks
- ✅ Mount/Unmount ISO files
- ✅ VNC console access (requires websockify)

### Virtual Disks
- ✅ Create disks (QCOW2, RAW, VMDK)
- ✅ Delete disks
- ✅ Attach to VMs
- ✅ Detach from VMs

### API Endpoints

**VMs:**
```
GET    /api/vms              # List all VMs
POST   /api/vms              # Create VM
GET    /api/vms/:id          # Get VM details
DELETE /api/vms/:id          # Delete VM
POST   /api/vms/:id/start    # Start VM
POST   /api/vms/:id/stop     # Stop VM
PATCH  /api/vms/:id/resources # Update CPU/RAM
POST   /api/vms/:id/disks/attach    # Attach disk
POST   /api/vms/:id/disks/detach    # Detach disk
POST   /api/vms/:id/iso/mount       # Mount ISO
POST   /api/vms/:id/iso/unmount     # Unmount ISO
```

**Disks:**
```
GET    /api/disks            # List all disks
POST   /api/disks            # Create disk
GET    /api/disks/:id        # Get disk info
DELETE /api/disks/:id        # Delete disk
```

## 💡 Usage Examples

### Create and manage a VM with disk and ISO

```bash
# Create VM
curl -X POST http://localhost:5000/api/vms \
  -H "Content-Type: application/json" \
  -d '{"name":"ubuntu","cpus":4,"memory":4096}'

# Create disk
curl -X POST http://localhost:5000/api/disks \
  -H "Content-Type: application/json" \
  -d '{"name":"disk1","size":30,"format":"qcow2"}'

# Attach disk to VM (VM_ID and DISK_PATH needed)
curl -X POST http://localhost:5000/api/vms/VM_ID/disks/attach \
  -H "Content-Type: application/json" \
  -d '{"diskPath":"/path/to/disk.qcow2"}'

# Mount ISO
curl -X POST http://localhost:5000/api/vms/VM_ID/iso/mount \
  -H "Content-Type: application/json" \
  -d '{"isoPath":"/path/to/ubuntu.iso"}'

# Start VM
curl -X POST http://localhost:5000/api/vms/VM_ID/start
```

## 🖥️ Setting up VNC Console Access

For browser-based VNC access, install and run websockify:

```bash
# Install websockify
sudo apt-get install websockify

# Start websockify proxy (in a separate terminal)
websockify 6080 127.0.0.1:5900

# Now use VNC console in the web UI
```

Or use an external VNC client:
```bash
# Use vncviewer to connect to VM
vncviewer 127.0.0.1:5900
```

## 📁 Key Files

- **Server**: `/server/src/index.js` - Main Express app
- **Client**: `/client/src/App.jsx` - React main component
- **QEMU Service**: `/server/src/services/qemuService.js` - VM management
- **Disk Service**: `/server/src/services/diskService.js` - Disk management
- **VM List Component**: `/client/src/components/VMList.jsx` - VM UI
- **VM Details Modal**: `/client/src/components/VMDetailsModal.jsx` - Disk/ISO management
- **VNC Console**: `/client/src/components/VNCConsole.jsx` - VNC viewer

## ⚙️ Configuration

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
QEMU_BIN=/usr/bin/qemu-system-x86_64
QEMU_IMG_BIN=/usr/bin/qemu-img
VMS_STORAGE_PATH=/home/francesco/Documenti/qemu-manager/vms
```

## 🐛 Troubleshooting

**QEMU not found:**
```bash
which qemu-system-x86_64
# Update QEMU_BIN path in .env if needed
```

**Port in use:**
```bash
lsof -i :5000  # Check what's using port 5000
kill -9 PID    # Kill the process
```

**Permission denied for QEMU:**
```bash
sudo usermod -aG kvm $USER
sudo usermod -aG libvirt $USER
# Restart session
```

## 📝 Project Structure

```
qemu-manager/
├── server/                  # Node.js/Express Backend
│   ├── src/
│   │   ├── index.js        # Express app setup
│   │   ├── routes/         # API routes (vms.js, disks.js)
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic (qemuService, diskService)
│   │   └── utils/          # Utilities
│   ├── package.json
│   └── .env
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # React components (VMList, DiskList, VNCConsole, VMDetailsModal)
│   │   ├── services/       # API client (api.js)
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Tailwind styles
│   ├── package.json
│   └── vite.config.js
├── package.json            # Root package.json (workspaces)
└── README.md               # User documentation
```

## 🎯 Next Features (Future Roadmap)

- [ ] libvirt integration for persistence
- [ ] VM snapshots and backups
- [ ] Network/bridge management
- [ ] VM templates
- [ ] Real-time resource monitoring
- [ ] Export/Import VMs
- [ ] Multi-host clustering
- [ ] User authentication and multi-user support

