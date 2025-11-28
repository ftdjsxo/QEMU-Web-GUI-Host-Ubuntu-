# QEMU Manager - Web Application

Una moderna web application per gestire macchine virtuali QEMU in remoto. Crea, avvia, arresta, e gestisci le risorse delle tue VM direttamente dal browser con una UI intuitiva.

## 🚀 Features

- ✅ **Gestione VM completa** - Crea, elimina, avvia e arresta macchine virtuali
- 🎮 **Allocazione Risorse** - Configura CPU e RAM per ogni VM
- 💾 **Gestione Dischi** - Crea e gestisci dischi virtuali in vari formati (QCOW2, RAW, VMDK)
- 🖥️ **Console VNC** - Accedi alle VM con NoVNC integrato
- 🎨 **UI Moderna** - Interfaccia elegante e responsive con Tailwind CSS
- ⚡ **Real-time Updates** - Controlli in tempo reale dello stato delle VM

## 📋 Requisiti

- **Node.js** >= 18
- **QEMU** installato sulla macchina
  ```bash
  # Ubuntu/Debian
  sudo apt-get install qemu-system-x86

  # Fedora/RHEL
  sudo dnf install qemu-system-x86
  ```
- **Port disponibili**: 3000/3001 (frontend), 5000 (backend), 6080 (NoVNC opzionale)

## 🏗️ Struttura del Progetto

```
qemu-manager/
├── server/              # Backend Node.js/Express
│   ├── src/
│   │   ├── index.js    # Server principale
│   │   ├── routes/     # API routes
│   │   ├── controllers/# Controllers
│   │   ├── services/   # Business logic
│   │   └── utils/      # Utility functions
│   ├── package.json
│   └── .env
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx     # Componente principale
│   │   ├── components/ # React components
│   │   ├── services/   # API client
│   │   └── index.css   # Styling
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
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

# Noterai che se la porta 3000 è occupata, Vite userà automaticamente 3001
# Navigare a: http://localhost:3001
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
```

### WebSocket

```
WS     /api/vnc/:vmId        # Connessione VNC alla VM
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

2. **Allegare un disco alla VM**:
   - Clicca sull'icona ⚙️ (Settings) sulla VM
   - Scorri fino a "Dischi Allegati"
   - Seleziona il disco dalla dropdown
   - Clicca "Allega Disco"
   - **NOTA**: La VM deve essere ferma per allegare/rimuovere dischi

3. **Rimuovere un disco**:
   - Nel modal della VM, sezione "Dischi Allegati"
   - Clicca "Rimuovi" accanto al disco
   - La VM deve essere ferma

### Montare ISO nella VM

1. Clicca sull'icona ⚙️ della VM che desideri installare
2. Sezione "ISO" - Inserisci il percorso completo:
   ```
   /path/to/ubuntu-22.04-live-server-amd64.iso
   ```
3. Clicca "Monta ISO"
4. Avvia la VM - partirà dall'ISO
5. Per smontare: clicca "Smonta"

### Accedere con VNC (Console VNC)

1. **Se la VM è in esecuzione**:
   - Clicca sull'icona ⚙️ della VM
   - Clicca il pulsante "Apri Console VNC"
   - Dovrà essere installato `websockify` per la connessione web

2. **Alternativa - Client VNC esterno**:
   - Usa `vncviewer` o altro client VNC
   - Connettiti a: `127.0.0.1:PORTA_VNC`
   - La porta VNC è mostrata nei dettagli della VM (es: `:0`, `:1`, etc)
   - Comando: 
   ```bash
   vncviewer 127.0.0.1:5900
   ```

3. **Setup noVNC per browser**:
   ```bash
   # Installa websockify
   sudo apt-get install websockify
   
   # Avvia websockify proxy (in un terminale separato)
   websockify 6080 127.0.0.1:5900
   
   # Ora puoi accedere da browser: http://localhost:6080
   ```

## 🔧 Configurazione Avanzata

### Abilitare NoVNC per accesso browser

```bash
# Installa novnc (opzionale, per access browser)
sudo apt-get install novnc

# Avvia novnc proxy
novnc_proxy --vnc localhost:5900-5999 --listen 6080
```

### Modificare le risorse di una VM ferma

```bash
curl -X PATCH http://localhost:5000/api/vms/VM_ID/resources \
  -H "Content-Type: application/json" \
  -d '{"cpus": 4, "memory": 4096}'
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

- [ ] Integrazione completa con libvirt
- [ ] Snapshot e backup VM
- [ ] Network management
- [ ] Template di VM pre-configurate
- [ ] Monitoring risorse in tempo reale
- [ ] Export/Import VM
- [ ] Clustering di host QEMU
- [ ] Autenticazione e multi-user

## 📝 License

MIT

## 👤 Supporto

Per bug report o feature request, crea una issue nel repository.

---

**Happy VM Management! 🎉**
