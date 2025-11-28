# QEMU Manager - Web Application

Una moderna web application per gestire macchine virtuali QEMU in remoto. Crea, avvia, arresta, e gestisci le risorse delle tue VM direttamente dal browser con una UI intuitiva.

## 🚀 Features

- ✅ **Gestione VM completa** - Crea, elimina, avvia e arresta macchine virtuali
- 🎮 **Allocazione Risorse** - Configura CPU e RAM per ogni VM
- 💾 **Gestione Dischi** - Crea e gestisci dischi virtuali in vari formati (QCOW2, RAW, VMDK) + **upload file**
- � **Gestione ISO** - Upload ISO e montaggio nelle VM + **dropdown selector**
- �🖥️ **Console VNC Integrata** - Accedi alle VM con NoVNC direttamente nel browser (come Proxmox!)
- 💾 **Persistenza Database** - SQLite per salvare stato VM, dischi e ISO tra riavvii
- 📊 **Upload con Progress Bar** - Visualizza barra di progresso per upload dischi/ISO
- 🎨 **UI Moderna** - Interfaccia elegante e responsive con Tailwind CSS dark theme
- ⚡ **Proxy WebSocket** - Tunnel WebSocket integrato per VNC (nessuna dipendenza esterna)

## 📋 Requisiti

- **Node.js** >= 18
- **QEMU** installato sulla macchina
  ```bash
  # Ubuntu/Debian
  sudo apt-get install qemu-system-x86

  # Fedora/RHEL
  sudo dnf install qemu-system-x86
  ```
- **Port disponibili**: 3001 (frontend), 5000 (backend)
- ⭐ **NESSUNA dipendenza esterna** per VNC - tutto integrato!

## 🏗️ Struttura del Progetto

```
qemu-manager/
├── server/              # Backend Node.js/Express
│   ├── src/
│   │   ├── index.js    # Server principale + proxy VNC WebSocket
│   │   ├── routes/     # API routes (vms, disks, isos)
│   │   ├── controllers/# Controllers per API
│   │   ├── services/   # Business logic (qemuService, diskService, isoService, database)
│   │   └── utils/      # Utility functions
│   ├── public/
│   │   ├── vnc-viewer.html  # Client NoVNC integrato
│   │   └── novnc/           # Libreria NoVNC v1.4.0
│   ├── package.json
│   └── .env
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx                       # Componente principale
│   │   ├── components/                   # React components
│   │   │   ├── VMList.jsx               # Lista VM
│   │   │   ├── DiskList.jsx             # Upload dischi con progress bar
│   │   │   ├── ISOList.jsx              # Upload ISO con progress bar
│   │   │   ├── VMDetailsModal.jsx       # Gestione VM (risorse, dischi, ISO, VNC)
│   │   │   └── VNCConsole.jsx           # Modal console VNC
│   │   ├── services/
│   │   │   └── api.js                   # Client API (vmAPI, diskAPI, isoAPI)
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── qemu-manager.db      # Database SQLite (creato automaticamente)
├── disks/               # Storage dischi virtuali
├── isos/                # Storage ISO
├── vms/                 # Storage configurazioni VM
├── package.json
└── README.md
```

### Database Schema (SQLite)

```sql
CREATE TABLE vms (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,
  cpus INTEGER,
  memory INTEGER,
  status TEXT,
  vnc_port INTEGER,
  iso TEXT,
  created_at TEXT,
  started_at TEXT
);

CREATE TABLE disks (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,
  path TEXT UNIQUE,
  size INTEGER,
  format TEXT,
  status TEXT,
  uploaded_at TEXT
);

CREATE TABLE isos (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE,
  path TEXT UNIQUE,
  size INTEGER,
  uploaded_at TEXT
);

CREATE TABLE vm_disks (
  vm_id TEXT,
  disk_path TEXT,
  PRIMARY KEY (vm_id, disk_path)
);
```

## 🚦 Quick Start

### 1. Installa le dipendenze

```bash
cd /home/francesco/Documenti/qemu-manager
npm install

# Oppure per ogni workspace separatamente
cd server && npm install
cd ../client && npm install
```

### 2. Configura il Backend

Modifica `server/.env`:
```env
PORT=5000
NODE_ENV=development
QEMU_BIN=/usr/bin/qemu-system-x86_64
QEMU_IMG_BIN=/usr/bin/qemu-img
VMS_STORAGE_PATH=/home/francesco/Documenti/qemu-manager/vms
```

### 3. Avvia il server

```bash
cd server
npm run dev

# Output atteso:
# 🚀 QEMU Manager Server running on port 5000
# 📍 Health check: http://localhost:5000/api/health
```

### 4. Avvia il client (in un nuovo terminale)

```bash
cd client
npm run dev

# Vite userà la porta 3001 se 3000 è occupata
# Navigare a: http://localhost:3001
```

### ⭐ Oppure avvia entrambi contemporaneamente

```bash
npm run dev
# Questo eseguisce sia backend che frontend in parallelo tramite workspaces
```

## 📚 API Endpoints

### Virtual Machines

```
GET    /api/vms              # Lista tutte le VM
POST   /api/vms              # Crea nuova VM
GET    /api/vms/:id          # Dettagli VM
DELETE /api/vms/:id          # Elimina VM
POST   /api/vms/:id/start    # Avvia VM
POST   /api/vms/:id/stop     # Arresta VM
PATCH  /api/vms/:id/resources # Aggiorna risorse (CPU/RAM)
```

### Virtual Disks

```
GET    /api/disks            # Lista tutti i dischi
POST   /api/disks            # Crea nuovo disco
GET    /api/disks/:id        # Info disco
DELETE /api/disks/:id        # Elimina disco
POST   /api/disks/upload     # Upload file disco (multipart/form-data)
```

### ISO Files

```
GET    /api/isos             # Lista tutte le ISO
POST   /api/isos/upload      # Upload file ISO (multipart/form-data)
DELETE /api/isos/:id         # Elimina ISO
```

### WebSocket

```
WS     /api/vnc/:vmId?port=5900  # Proxy WebSocket VNC (integrato nel browser)
```

## 💡 Utilizzo

### Creare una VM

1. Clicca su "New VM" nella sezione Virtual Machines
2. Compila il form:
   - **VM Name**: Nome univoco della macchina
   - **CPUs**: Numero di processori (1-16)
   - **RAM**: Memoria in MB (min 512)
3. Clicca "Create"

### Avviare/Arrestare una VM

1. Seleziona la VM dalla lista
2. Clicca "Start" per avviare o "Stop" per arrestare
3. Lo stato si aggiornerà automaticamente

### Gestire i Dischi di una VM

1. **Creare un disco**:
   - Vai a "Virtual Disks"
   - Clicca "New Disk"
   - Scegli nome, dimensione (GB) e formato (QCOW2 consigliato)
   - Clicca "Create"

2. **Upload di un disco**:
   - Vai a "Virtual Disks"
   - Clicca "Upload Disk"
   - Seleziona il file del disco
   - Visualizzerai una **progress bar in tempo reale**
   - Una volta caricato, apparirà nella lista

3. **Allegare un disco alla VM**:
   - Clicca sull'icona ⚙️ (Settings) sulla VM
   - Scorri fino a "Dischi Allegati"
   - Seleziona il disco dalla dropdown
   - Clicca "Allega Disco"
   - ⚠️ **La VM deve essere ferma** per allegare/rimuovere dischi

4. **Rimuovere un disco**:
   - Nel modal della VM, sezione "Dischi Allegati"
   - Clicca "Rimuovi" accanto al disco
   - La VM deve essere ferma

### Montare ISO nella VM

1. **Upload ISO**:
   - Vai a "ISO Files" nel menu
   - Clicca "Upload ISO"
   - Seleziona il file ISO
   - Visualizzerai una **progress bar in tempo reale**
   - Una volta caricata, apparirà nella lista

2. **Montare l'ISO nella VM**:
   - Clicca sull'icona ⚙️ della VM
   - Sezione "ISO" - Seleziona dalla **dropdown** l'ISO desiderata
   - Clicca "Monta ISO"
   - Avvia la VM - partirà dall'ISO
   - Per smontare: clicca "Smonta"

### Accedere con VNC (Console VNC Integrata) 🖥️

La console VNC è **completamente integrata** nel browser, come in Proxmox!

1. **Accedere alla console**:
   - Se la VM è in esecuzione, clicca sull'icona ⚙️ della VM
   - Clicca il pulsante **"Apri Console VNC"**
   - Si aprirà un modal con il client NoVNC integrato

2. **Controllare la VM**:
   - Usa mouse e tastiera normalmente
   - Clicca il bottone **"⌨️ Ctrl+Alt+Del"** per inviare il comando
   - Clicca **"🖥️ Fullscreen"** per modalità fullscreen (F11 o Ctrl+Shift+F)

3. **Pronto all'uso** - ⭐ **Nessuna configurazione aggiuntiva necessaria!**
   - Tutto è gestito dal proxy WebSocket integrato nel backend
   - NoVNC è caricato localmente dal server
   - Non hai bisogno di websockify o altre dipendenze

## 🔧 Configurazione Avanzata

### Database SQLite

Il database viene creato automaticamente al primo avvio in:
```
/home/francesco/Documenti/qemu-manager/qemu-manager.db
```

Contiene tutti i dati persistenti:
- Stato delle VM (accesa/spenta)
- Metadati dischi e ISO
- Allocazioni risorse

I dati **sopravvivono ai riavvii** del server!

### Variabili di Ambiente (.env)

Modifica `server/.env` per personalizzare:

```env
PORT=5000
NODE_ENV=development

# Percorsi di QEMU
QEMU_BIN=/usr/bin/qemu-system-x86_64
QEMU_IMG_BIN=/usr/bin/qemu-img

# Storage paths
VMS_STORAGE_PATH=/home/francesco/Documenti/qemu-manager/vms
DISKS_STORAGE_PATH=/home/francesco/Documenti/qemu-manager/disks
ISO_STORAGE_PATH=/home/francesco/Documenti/qemu-manager/isos

# Upload limits
MAX_ISO_SIZE=5368709120          # 5GB
MAX_DISK_SIZE=107374182400       # 100GB
```

### Modificare le risorse di una VM ferma

```bash
curl -X PATCH http://localhost:5000/api/vms/VM_ID/resources \
  -H "Content-Type: application/json" \
  -d '{"cpus": 4, "memory": 4096}'
```

### Allegare un disco tramite API

```bash
curl -X POST http://localhost:5000/api/vms/VM_ID/disks/attach \
  -H "Content-Type: application/json" \
  -d '{"diskPath": "/path/to/disk.qcow2"}'
```

### Montare un'ISO tramite API

```bash
curl -X POST http://localhost:5000/api/vms/VM_ID/iso/mount \
  -H "Content-Type: application/json" \
  -d '{"isoPath": "/path/to/ubuntu.iso"}'
```

## 🐛 Troubleshooting

### QEMU non trovato
```bash
# Verifica il path di QEMU
which qemu-system-x86_64

# Aggiorna .env con il path corretto
QEMU_BIN=/percorso/corretto/qemu-system-x86_64
```

### Porta già in uso
```bash
# Cambia la porta in .env
PORT=5001

# Oppure libera la porta
lsof -i :5000
kill -9 PID
```

### Errore permessi QEMU
```bash
# Aggiungi l'utente al gruppo kvm/libvirt
sudo usermod -aG kvm $USER
sudo usermod -aG libvirt $USER
# Riavvia la sessione
```

## 🎯 Roadmap Futuri

- [ ] Snapshot e backup VM
- [ ] Network bridge management
- [ ] Template di VM pre-configurate
- [ ] Monitoring risorse in tempo reale (CPU, RAM, I/O)
- [ ] Export/Import VM
- [ ] Clustering di host QEMU multipli
- [ ] Autenticazione e multi-user support
- [ ] Cloud-init per automatizzazione
- [ ] Integrazione libvirt per persistenza
- [ ] Live migration tra host

## 📝 License

MIT

## 👤 Supporto

Per bug report o feature request, crea una issue nel repository.

---

## 🎉 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Lucide Icons, Axios
- **Backend**: Node.js, Express 4, express-ws, better-sqlite3
- **VNC**: NoVNC 1.4.0 (integrato)
- **File Upload**: Multer con progress tracking
- **Database**: SQLite3 (persistenza automatica)

---

**Progettato e realizzato per gestire QEMU VM come un professionista! 🚀**

**Happy VM Management! 🎉**
