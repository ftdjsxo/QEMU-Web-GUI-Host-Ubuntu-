import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import expressWs from 'express-ws';
import vmRoutes from './routes/vms.js';
import diskRoutes from './routes/disks.js';
import isoRoutes from './routes/isos.js';

dotenv.config();

const app = express();
const wsApp = expressWs(app).app;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/vms', vmRoutes);
app.use('/api/disks', diskRoutes);
app.use('/api/isos', isoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// VNC WebSocket endpoint
app.ws('/api/vnc/:vmId', (ws, req) => {
  const { vmId } = req.params;
  console.log(`VNC WebSocket connected for VM: ${vmId}`);
  
  ws.on('message', (msg) => {
    console.log(`VNC message from ${vmId}:`, msg.length, 'bytes');
  });
  
  ws.on('close', () => {
    console.log(`VNC WebSocket closed for VM: ${vmId}`);
  });
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
