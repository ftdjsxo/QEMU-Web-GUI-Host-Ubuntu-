# 🎉 QEMU Manager - Setup Completato!

## ✅ Lo Stato Attuale

```
┌─────────────────────────────────────────────────────┐
│         QEMU Manager - Full Stack Deploy            │
│                                                     │
│  ✅ Backend (Express.js)   → http://localhost:5000  │
│  ✅ Frontend (React+Vite)  → http://localhost:3001  │
│  ✅ API Health Check       → ✓ Responding           │
└─────────────────────────────────────────────────────┘
```

---

## 📱 Interfaccia Web

### Dashboard
```
┌─ QEMU Manager ─────────────────────────────────────┐
│                                                    │
│ SIDEBAR:                    MAIN AREA:            │
│  🖥️ Virtual Machines ↔ List of VMs & Actions    │
│  💾 Virtual Disks                                │
│                                                    │
│ Per ogni VM vedi:                                │
│  • Nome, CPUs, RAM, Stato                        │
│  • Pulsanti: ⚙️ Settings, ▶️ Start, ⏹️ Stop     │
│  • Azioni: Elimina                               │
└─────────────────────────────────────────────────────┘
```

---

## 🎮 Workflow Illustrato

### Step 1️⃣: Crea VM
```
New VM → Nome: "ubuntu" → CPU: 4 → RAM: 4096 → Create
↓
VM creata nello stato STOPPED (rosso)
```

### Step 2️⃣: Crea Disco
```
Virtual Disks → New Disk → Nome: "ubuntu-disk" → Size: 30GB → Format: qcow2 → Create
↓
Disco creato
```

### Step 3️⃣: Configura VM
```
Clicca ⚙️ su VM → VMDetailsModal si apre
```

**Nel Modal vedi:**
```
┌─ ubuntu (Settings) ─────────────────────────────────┐
│                                                     │
│ Status: STOPPED  |  CPU: 4  |  RAM: 4096  | Port: 0│
│                                                     │
│ 💾 DISCHI ALLEGATI:                                │
│   [Nessun disco] + [Seleziona: ubuntu-disk]        │
│   Bottone: Allega Disco                            │
│                                                     │
│ 💿 ISO:                                             │
│   [Input path] + [Monta ISO]                       │
│   Es: /path/to/ubuntu.iso                          │
│                                                     │
│ Informazioni VM: ID, data creazione                │
└─────────────────────────────────────────────────────┘
```

### Step 4️⃣: Allega Disco
```
Seleziona "ubuntu-disk" dalla dropdown
Clicca "Allega Disco"
↓
Disco allegato ✅
```

### Step 5️⃣: Monta ISO
```
Inserisci: /path/to/ubuntu-22.04.iso
Clicca "Monta ISO"
↓
ISO montata ✅
```

### Step 6️⃣: Avvia VM
```
Chiudi Modal (❌)
Clicca Start sulla VM
↓
VM passa a stato RUNNING (verde) 🟢
```

### Step 7️⃣: Accedi Console VNC
```
Clicca ⚙️ su VM → Modal aperto
Vedi bottone: "🖥️ Apri Console VNC" (solo se RUNNING)
Clicca → Console VNC appare in modal grande

Dentro vedi:
- La finestra di boot di QEMU
- Schermo della VM
- Interagisci per installare SO
```

---

## 🔌 Struttura Backend API

```
┌─ REQUESTS ──────────────┬─ HANDLERS ───────────────┬─ RESPONSES ─┐
│ POST /api/vms           │ Create VM               │ {vm: {...}} │
│ GET  /api/vms           │ List VMs                │ {vms: [...]}│
│ POST /api/vms/:id/start │ Start VM                │ {vm: {...}} │
│ POST /api/vms/:id/stop  │ Stop VM                 │ {vm: {...}} │
│                         │                         │             │
│ POST /api/vms/:id/disks/attach  │ Attach disk  │ {vm: {...}} │
│ POST /api/vms/:id/disks/detach  │ Detach disk  │ {vm: {...}} │
│                         │                         │             │
│ POST /api/vms/:id/iso/mount   │ Mount ISO      │ {vm: {...}} │
│ POST /api/vms/:id/iso/unmount │ Unmount ISO    │ {vm: {...}} │
│                         │                         │             │
│ POST /api/disks         │ Create disk             │ {disk: {...}}
│ GET  /api/disks         │ List disks              │ {disks: [...]}
│ DELETE /api/disks/:id   │ Delete disk             │ {message: ...}
└─────────────────────────┴─────────────────────────┴─────────────┘
```

---

## 🗂️ Componenti React Coinvolti

```
App.jsx
├── Sidebar Navigation
│   ├── Button: Virtual Machines
│   └── Button: Virtual Disks
│
└── Main Content
    ├── VMList.jsx (quando selezionato "Virtual Machines")
    │   ├── Mostra lista VM
    │   ├── Bottone New VM
    │   ├── Per ogni VM:
    │   │   ├── Bottone ⚙️ Settings → Apre VMDetailsModal
    │   │   ├── Bottone ▶️ Start
    │   │   ├── Bottone ⏹️ Stop
    │   │   └── Bottone 🗑️ Delete
    │   │
    │   └── VMDetailsModal.jsx (modal dettagli VM)
    │       ├── Sezione Dischi Allegati
    │       │   ├── Lista dischi allegati
    │       │   ├── Dropdown seleziona disco
    │       │   └── Bottone Allega
    │       │
    │       ├── Sezione ISO
    │       │   ├── Input percorso ISO
    │       │   └── Bottone Monta/Smonta
    │       │
    │       └── Bottone "Apri Console VNC" (se VM running)
    │           └── VNCConsole.jsx
    │               └── Container NoVNC
    │
    └── DiskList.jsx (quando selezionato "Virtual Disks")
        ├── Mostra lista dischi
        ├── Bottone New Disk
        └── Per ogni disco: Bottone 🗑️ Delete
```

---

## 🔑 Punti Chiave da Ricordare

| Azione | Stato VM | Risultato |
|--------|----------|-----------|
| **Creare VM** | N/A | VM creata in STOPPED |
| **Creare Disco** | N/A | Disco creato in READY |
| **Allegare Disco** | ❌ MUST BE STOPPED | Disco aggiunto a lista |
| **Montare ISO** | ⏸️ Indifferente | ISO impostata su VM |
| **Rimuovere Disco** | ❌ MUST BE STOPPED | Disco rimosso da lista |
| **Avviare VM** | ✅ STOPPED | VM va in RUNNING + NoVNC disponibile |
| **Accedere VNC** | ✅ ONLY IF RUNNING | Console visibile nel Modal |

---

## 📁 Dove Trovare Tutto

```
/home/francesco/Documenti/qemu-manager/
├── server/
│   ├── src/
│   │   ├── index.js ..................... Main server
│   │   ├── services/
│   │   │   ├── qemuService.js .......... VM logic (attach, mount)
│   │   │   └── diskService.js ......... Disk logic
│   │   └── routes/
│   │       └── vms.js ................. Disk/ISO endpoints
│   └── .env ........................... QEMU paths
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VMList.jsx ............. VM list + new button
│   │   │   ├── VMDetailsModal.jsx .... Disk/ISO management
│   │   │   └── VNCConsole.jsx ........ NoVNC viewer
│   │   ├── services/
│   │   │   └── api.js ................ API calls
│   │   └── App.jsx ................... Main layout
│   └── index.html ..................... Entry point
│
├── README.md ......................... Full docs
├── QUICK_START.md ................... Risposte tue domande
└── .github/
    └── copilot-instructions.md ....... Setup notes
```

---

## 🚀 Comandi Utili

```bash
# Restart backend
cd /home/francesco/Documenti/qemu-manager/server && npm run dev

# Restart frontend
cd /home/francesco/Documenti/qemu-manager/client && npm run dev

# Test API
curl http://localhost:5000/api/health
curl http://localhost:5000/api/vms

# Check QEMU
which qemu-system-x86_64
which qemu-img

# Check ports
lsof -i :5000
lsof -i :3001
```

---

## 📞 Se Qualcosa Non Funziona

1. **Backend non risponde?**
   ```bash
   curl http://localhost:5000/api/health
   # Se timeout → Restarta backend
   ```

2. **Disco non allegato?**
   - VM deve essere STOPPED
   - Disco deve esistere (creato in Virtual Disks)

3. **ISO non montata?**
   - Inserisci percorso assoluto
   - Es: `/home/user/ubuntu.iso`

4. **NoVNC non appare?**
   - VM deve essere in RUNNING
   - Prova accesso via client VNC:
     ```bash
     vncviewer 127.0.0.1:5900
     ```

---

**Goditi il tuo QEMU Manager! 🎮✨**
