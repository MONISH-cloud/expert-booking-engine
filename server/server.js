require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const expertRoutes = require('./src/routes/expertRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// ── Socket.io with expert-specific rooms ─────────────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5175', methods: ['GET', 'POST'] },
  pingInterval: 10000,
  pingTimeout: 5000,
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  // Client joins an expert-specific room when viewing a detail page
  socket.on('joinExpert', (expertId) => {
    socket.join(`expert-${expertId}`);
    console.log(`[SOCKET] ${socket.id} joined room expert-${expertId}`);
  });

  socket.on('leaveExpert', (expertId) => {
    socket.leave(`expert-${expertId}`);
    console.log(`[SOCKET] ${socket.id} left room expert-${expertId}`);
  });

  // Heartbeat / reconnect: client requests fresh data flag
  socket.on('requestSync', (expertId) => {
    socket.emit('syncRequired', { expertId });
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Store io so controllers can access it via req.app.get('io')
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5175' }));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[DB] MongoDB connected');
    server.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  });
