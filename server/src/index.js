import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import expressWs from 'express-ws';
import path from 'path';
import { fileURLToPath } from 'url';
import vmRoutes from './routes/vms.js';
import diskRoutes from './routes/disks.js';
import isoRoutes from './routes/isos.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const wsApp = expressWs(app).app;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve public directory (novnc and other static files)
app.use(express.static(path.join(__dirname, '../public')));

// Set correct MIME type for ES6 modules in NoVNC
app.use('/novnc', (req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
  next();
});

// Serve NoVNC statically
app.use('/novnc', express.static(path.join(__dirname, '../public/novnc')));

// Routes
app.use('/api/vms', vmRoutes);
app.use('/api/disks', diskRoutes);
app.use('/api/isos', isoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// VNC WebSocket proxy endpoint
import net from 'net';

app.ws('/api/vnc/:vmId', (ws, req) => {
  const { vmId } = req.params;
  const vncPort = parseInt(req.query.port) || 5900; // Default VNC port
  
  console.log(`🖥️ VNC WebSocket connecting to VM ${vmId} on port ${vncPort}...`);
  
  let vncSocket = null;
  
  try {
    // Connetti al server VNC locale
    vncSocket = net.createConnection({
      host: '127.0.0.1',
      port: vncPort,
      timeout: 5000
    });
    
    vncSocket.on('connect', () => {
      console.log(`✅ VNC connected to port ${vncPort}`);
    });
    
    // Inoltra i dati dal WebSocket al VNC socket
    ws.on('message', (msg) => {
      if (vncSocket && !vncSocket.destroyed) {
        vncSocket.write(msg);
      }
    });
    
    // Inoltra i dati dal VNC socket al WebSocket
    vncSocket.on('data', (data) => {
      try {
        ws.send(data);
      } catch (err) {
        console.error('Errore invio WebSocket:', err.message);
      }
    });
    
    // Gestione errori e chiusura
    vncSocket.on('error', (err) => {
      console.error(`❌ VNC socket error:`, err.message);
      try {
        ws.send(JSON.stringify({ error: err.message }));
      } catch (e) {}
      ws.close();
    });
    
    vncSocket.on('end', () => {
      console.log(`🔌 VNC socket closed`);
      ws.close();
    });
    
    ws.on('close', () => {
      console.log(`🔌 WebSocket closed for VM: ${vmId}`);
      if (vncSocket && !vncSocket.destroyed) {
        vncSocket.destroy();
      }
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      if (vncSocket && !vncSocket.destroyed) {
        vncSocket.destroy();
      }
    });
    
  } catch (error) {
    console.error('VNC connection error:', error);
    ws.close();
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 QEMU Manager Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});
