// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Import your database connection
const connectDB = require('./config/db');

// Create Express app
const app = express();

// Connect to MongoDB (with better error handling)
let dbConnected = false;
let dbConnectionPromise = connectDB().then(connected => {
  dbConnected = connected;
  console.log('Database connection status:', connected);
  return connected;
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  dbConnected = false;
  return false;
});

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const fbrInvoiceRoutes = require('./routes/fbrInvoiceRoutes');
const userRoutes = require('./routes/userRoutes');
const apiSettingsRoutes = require('./routes/fbrApiSettingsRoutes');
const exportRoutes = require('./routes/exportRoutes');

app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/fbr-invoices', fbrInvoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fbr-api-settings', apiSettingsRoutes);
app.use('/api/export', exportRoutes);

// ===== Health Check / Root Route =====
app.get('/', async (req, res) => {
  try {
    // Wait for database connection to complete
    const dbStatus = await dbConnectionPromise;
    
    res.json({
      message: '✅ API is running...',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: dbStatus ? 'connected' : 'disconnected',
      mongoUri: process.env.MONGO_URI ? 'set' : 'not set'
    });
  } catch (error) {
    res.json({
      message: '✅ API is running...',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: 'error',
      error: error.message
    });
  }
});

// ===== CORS Test Route =====
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header',
    method: req.method
  });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app; 
