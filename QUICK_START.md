# QEMU Manager - Quick Reference Guide

## 🎯 Risposte alle tue domande

### 1️⃣ Come associo un disco alla macchina?

**Dalla Web UI:**
1. Clicca sull'icona ⚙️ **Settings** accanto alla VM
2. Scorri fino a "**Dischi Allegati**"
3. Dalla dropdown, seleziona il disco che hai creato
4. Clicca "**Allega Disco**"
5. **Importante**: La VM deve essere **ferma** per allegare/rimuovere dischi

**Via API:**
```bash
curl -X POST http://localhost:5000/api/vms/VM_ID/disks/attach \
  -H "Content-Type: application/json" \
  -d '{"diskPath":"/home/francesco/Documenti/qemu-manager/vms/disk1.qcow2"}'
```

---

### 2️⃣ Come associo una ISO alla macchina?

**Dalla Web UI:**
1. Clicca sull'icona ⚙️ **Settings** della VM
2. Sezione "**ISO**" - Se vuoto, inserisci il percorso completo
3. Esempio:
   ```
   /path/to/ubuntu-22.04-live-server-amd64.iso
   ```
4. Clicca "**Monta ISO**"
5. Avvia la VM - partirà dall'ISO per l'installazione
6. Per smontare dopo l'installazione: clicca "**Smonta**"

**Via API:**
```bash
curl -X POST http://localhost:5000/api/vms/VM_ID/iso/mount \
  -H "Content-Type: application/json" \
  -d '{"isoPath":"/path/to/ubuntu.iso"}'
```

---

### 3️⃣ Dove vedo NoVNC quando una macchina è in esecuzione?

**Dalla Web UI:**
1. Clicca sull'icona ⚙️ **Settings** della VM che è **in esecuzione** (stato: GREEN "RUNNING")
2. In alto a destra vedrai il pulsante: **"🖥️ Apri Console VNC"**
3. Clicca il pulsante - si aprirà la console VNC in una modal

**Porta VNC:**
- La porta VNC è mostrata nei dettagli della VM
- Esempio: se vedi `:0`, la porta è **5900**
- Se vedi `:1`, la porta è **5901**

**Client VNC Esterno (alternativa):**
```bash
# Se vuoi usare vncviewer
vncviewer 127.0.0.1:5900

# Oppure per accesso web, installa websockify:
sudo apt-get install websockify
websockify 6080 127.0.0.1:5900
# Poi accedi a: http://localhost:6080
```

---

## 🔄 Workflow Completo: Installare un SO in una VM

```bash
# 1. Creare una VM
# UI: New VM → ubuntu, 4 CPU, 4096 MB → Create

# 2. Creare un disco per la VM
# UI: Virtual Disks → New Disk → ubuntu-disk, 30GB, qcow2 → Create

# 3. Configurare la VM
# Clicca Settings (⚙️) sulla VM

# 4. Allegare disco
# Dischi Allegati → Seleziona ubuntu-disk → Allega Disco

# 5. Montare ISO
# ISO → /path/to/ubuntu.iso → Monta ISO

# 6. Avviare la VM
# Pulsante Start → VM avvia

# 7. Accedere alla console
# Settings → Apri Console VNC
# Installa il SO da console

# 8. Smontare ISO dopo installazione
# Settings → ISO → Smonta
```

---

## 📋 File Importanti

| File | Descrizione |
|------|-------------|
| `server/src/services/qemuService.js` | Logica VM (create, start, stop, attachDisk, mountISO) |
| `client/src/components/VMDetailsModal.jsx` | Modal per gestire dischi, ISO e VNC |
| `client/src/components/VNCConsole.jsx` | Viewer VNC (NoVNC) |
| `server/src/routes/vms.js` | Endpoint `/api/vms/:id/disks/*` e `/api/vms/:id/iso/*` |

---

## 🚀 Avvio

```bash
# Terminal 1 - Backend
cd /home/francesco/Documenti/qemu-manager/server
npm run dev

# Terminal 2 - Frontend
cd /home/francesco/Documenti/qemu-manager/client
npm run dev

# Accedi a: http://localhost:3001
```

---

## ✅ Checklist Rapido

- [ ] Backend in esecuzione (porta 5000)
- [ ] Frontend in esecuzione (porta 3001)
- [ ] QEMU installato: `which qemu-system-x86_64`
- [ ] Dischi creati in "Virtual Disks"
- [ ] VM creata con CPU/RAM configurate
- [ ] Disco allegato alla VM
- [ ] ISO montata
- [ ] VM avviata
- [ ] NoVNC aperto dalla UI

---

**Divertiti! 🎮**
