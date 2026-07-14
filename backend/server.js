const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS allows the React app, which may run on a different localhost port during
// development, to call this API from the browser. localhost and 127.0.0.1 are
// treated as safe local origins when loaded from any port.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      try {
        const parsed = new URL(origin);
        if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && parsed.port) {
          return callback(null, true);
        }
      } catch (error) {
        // Fall through to block invalid origins.
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

// These middleware functions parse JSON and form bodies before routes read req.body.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded CV files are served from /uploads/<filename> so employers can open them.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health checks are useful for confirming both Express and the database are reachable.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'unavailable', error: error.message });
  }
});

// Each group of API endpoints is mounted under a clear route prefix.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Any request that reached this point did not match a defined route.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler. Multer upload errors and normal server errors are returned as JSON.
app.use((error, req, res, next) => {
  if (error.name === 'MulterError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.message && error.message.includes('Only PDF')) {
    return res.status(400).json({ message: error.message });
  }
  // Log the full error for debugging while returning a minimal message to clients.
  console.error(error);
  res.status(500).json({ message: 'Server error', error: error.message });
});

// Start the HTTP server after all middleware and routes have been registered.
// If the desired port is in use, retry on the next port up to a small limit
// rather than letting the process crash — this keeps `nodemon` running.
const MAX_PORT_RETRIES = 5;

function startServer(port, retriesLeft = MAX_PORT_RETRIES) {
  const server = app.listen(port, () => {
    console.log(`JobConnect API running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
      if (retriesLeft > 0) {
        const nextPort = Number(port) + 1;
        console.log(`Attempting to listen on port ${nextPort} (${retriesLeft - 1} retries left)...`);
        // Give a short delay to avoid busy-looping when many restarts happen.
        setTimeout(() => startServer(nextPort, retriesLeft - 1), 300);
      } else {
        console.error('No available ports found. Exiting.');
        // Exit with a non-zero code so the caller knows startup failed.
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  return server;
}

if (process.env.NODE_ENV !== 'production') {
  startServer(PORT);
}

module.exports = app;
