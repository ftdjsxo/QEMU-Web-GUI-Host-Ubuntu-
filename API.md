# API Documentation - QEMU Manager

## Base URL
```
http://localhost:5000/api
```

---

## 📋 Virtual Machines (VMs)

### List all VMs
```http
GET /vms
```
**Response:**
```json
{
  "vms": [
    {
      "id": "uuid-123",
      "name": "ubuntu",
      "cpus": 4,
      "memory": 4096,
      "status": "stopped",
      "vnc_port": 5900,
      "disks": [],
      "iso": null,
      "createdAt": "2025-11-28T14:00:00.000Z"
    }
  ]
}
```

---

### Create a VM
```http
POST /vms
Content-Type: application/json

{
  "name": "ubuntu-server",
  "cpus": 4,
  "memory": 4096
}
```
**Response:**
```json
{
  "vm": { /* VM object */ }
}
```

---

### Get VM Details
```http
GET /vms/{vm_id}
```
**Response:**
```json
{
  "vm": { /* VM object with all details */ }
}
```

---

### Delete a VM
```http
DELETE /vms/{vm_id}
```
**Response:**
```json
{
  "message": "VM deleted successfully"
}
```

---

### Start a VM
```http
POST /vms/{vm_id}/start
```
**Response:**
```json
{
  "vm": { /* Updated VM object */ },
  "command": "qemu-system-x86_64 -m 4096 -smp 4 ..."
}
```

---

### Stop a VM
```http
POST /vms/{vm_id}/stop
```
**Response:**
```json
{
  "message": "VM stopped successfully"
}
```

---

### Update VM Resources (CPU/RAM)
```http
PATCH /vms/{vm_id}/resources
Content-Type: application/json

{
  "cpus": 8,
  "memory": 8192
}
```
**Response:**
```json
{
  "vm": { /* Updated VM object */ }
}
```
**Note:** VM must be stopped

---

## 💾 Disk Management

### Attach Disk to VM
```http
POST /vms/{vm_id}/disks/attach
Content-Type: application/json

{
  "diskPath": "/home/user/disks/ubuntu-disk.qcow2"
}
```
**Response:**
```json
{
  "vm": {
    "id": "uuid-123",
    "disks": [
      {
        "path": "/home/user/disks/ubuntu-disk.qcow2",
        "attachedAt": "2025-11-28T14:30:00.000Z"
      }
    ]
  }
}
```
**Requirements:**
- VM must be **STOPPED**
- Disk file must exist
- VM can have multiple disks

---

### Detach Disk from VM
```http
POST /vms/{vm_id}/disks/detach
Content-Type: application/json

{
  "diskPath": "/home/user/disks/ubuntu-disk.qcow2"
}
```
**Response:**
```json
{
  "vm": { /* Updated VM object */ }
}
```
**Requirements:**
- VM must be **STOPPED**

---

## 📀 ISO Management

### Mount ISO
```http
POST /vms/{vm_id}/iso/mount
Content-Type: application/json

{
  "isoPath": "/home/user/isos/ubuntu-22.04-live-server-amd64.iso"
}
```
**Response:**
```json
{
  "vm": {
    "id": "uuid-123",
    "iso": "/home/user/isos/ubuntu-22.04-live-server-amd64.iso"
  }
}
```
**Requirements:**
- ISO file must exist
- Only one ISO per VM

---

### Unmount ISO
```http
POST /vms/{vm_id}/iso/unmount
```
**Response:**
```json
{
  "vm": {
    "id": "uuid-123",
    "iso": null
  }
}
```

---

## 💿 Virtual Disks

### List all Disks
```http
GET /disks
```
**Response:**
```json
{
  "disks": [
    {
      "id": "uuid-456",
      "name": "ubuntu-disk",
      "size": 30,
      "format": "qcow2",
      "path": "/home/user/vms/ubuntu-disk.qcow2",
      "status": "ready",
      "createdAt": "2025-11-28T14:00:00.000Z",
      "createdAtCompleted": "2025-11-28T14:00:05.000Z"
    }
  ]
}
```

---

### Create a Disk
```http
POST /disks
Content-Type: application/json

{
  "name": "ubuntu-disk",
  "size": 30,
  "format": "qcow2"
}
```
**Parameters:**
- `name` (string): Disk name
- `size` (number): Size in GB
- `format` (string): "qcow2", "raw", or "vmdk"

**Response:**
```json
{
  "disk": { /* Disk object */ }
}
```

---

### Get Disk Info
```http
GET /disks/{disk_id}
```
**Response:**
```json
{
  "disk": {
    "id": "uuid-456",
    "name": "ubuntu-disk",
    "size": 30,
    "format": "qcow2",
    "path": "/home/user/vms/ubuntu-disk.qcow2",
    "status": "ready",
    "info": {
      "virtual-size": 32212254720,
      "filename": "/home/user/vms/ubuntu-disk.qcow2",
      "format": "qcow2",
      "actual-size": 1234567890
    }
  }
}
```

---

### Delete a Disk
```http
DELETE /disks/{disk_id}
```
**Response:**
```json
{
  "message": "Disk deleted successfully"
}
```
**Note:** Disk must not be attached to any VM

---

## 🖥️ VNC Console

### WebSocket Connection
```
WS /api/vnc/{vm_id}
```
**Usage:**
- Connect from browser NoVNC client
- Automatically handled by VNCConsole component
- Requires websockify proxy for web access

---

## 🏥 Health Check

### API Health Status
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T14:30:00.000Z"
}
```

---

## 📊 Complete Workflow Example

```bash
# 1. Create VM
curl -X POST http://localhost:5000/api/vms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ubuntu-server",
    "cpus": 4,
    "memory": 4096
  }'
# Save VM_ID from response

# 2. Create Disk
curl -X POST http://localhost:5000/api/disks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ubuntu-disk",
    "size": 30,
    "format": "qcow2"
  }'
# Save DISK_PATH from response

# 3. Attach Disk (VM must be stopped)
curl -X POST http://localhost:5000/api/vms/{VM_ID}/disks/attach \
  -H "Content-Type: application/json" \
  -d '{
    "diskPath": "/home/user/vms/ubuntu-disk.qcow2"
  }'

# 4. Mount ISO
curl -X POST http://localhost:5000/api/vms/{VM_ID}/iso/mount \
  -H "Content-Type: application/json" \
  -d '{
    "isoPath": "/home/user/isos/ubuntu-22.04.iso"
  }'

# 5. Start VM
curl -X POST http://localhost:5000/api/vms/{VM_ID}/start

# 6. Access VM via VNC
# Use browser: http://localhost:3001
# Click Settings (⚙️) on VM
# Click "Apri Console VNC"

# 7. Stop VM
curl -X POST http://localhost:5000/api/vms/{VM_ID}/stop

# 8. Unmount ISO
curl -X POST http://localhost:5000/api/vms/{VM_ID}/iso/unmount

# 9. Detach Disk (VM must be stopped)
curl -X POST http://localhost:5000/api/vms/{VM_ID}/disks/detach \
  -H "Content-Type: application/json" \
  -d '{
    "diskPath": "/home/user/vms/ubuntu-disk.qcow2"
  }'

# 10. Delete VM
curl -X DELETE http://localhost:5000/api/vms/{VM_ID}
```

---

## ⚠️ Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message description",
  "timestamp": "2025-11-28T14:30:00.000Z"
}
```

**Common errors:**
- `400`: Bad Request - Missing or invalid parameters
- `404`: Not Found - VM/Disk doesn't exist
- `500`: Internal Server Error - Server issue

---

## 🔐 Important Notes

- **VM Status Transitions:**
  - Created VMs start in `stopped` state
  - Can only attach/detach disks when `stopped`
  - ISO can be mounted at any state
  
- **Disk Paths:**
  - Must be absolute paths
  - File must exist on filesystem
  
- **Port Assignments:**
  - VNC ports are auto-assigned starting from 5900
  - Display number = vnc_port - 5900 (e.g., port 5900 = display :0)

---

**API Version:** 1.0.0  
**Last Updated:** 2025-11-28
