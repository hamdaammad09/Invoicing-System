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
  // Add cache-busting header
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://consultancy-frontend-eight.vercel.app',
    'https://*.vercel.app' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition']
}));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://consultancy-frontend-eight.vercel.app'
  ];
  
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('CORS header set for origin:', origin);
  } else {
    console.log('Origin not allowed:', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.sendStatus(200);
  } else {
    next();
  }
});
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
const pdfRoutes = require('./routes/pdfRoutes');
const sellerSettingsRoutes = require('./routes/sellerSettingsRoutes');

app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/fbrinvoices', fbrInvoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fbr-api-settings', apiSettingsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/seller-settings', sellerSettingsRoutes);

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
      mongoUri: process.env.MONGO_URI ? 'set' : 'not set',
      version: '2.0.4',
      corsEnabled: true,
      deployment: 'final-cors-fix',
      corsHeaders: {
        'Access-Control-Allow-Origin': 'https://consultancy-frontend-eight.vercel.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      },
      buildId: Date.now()
    });
  } catch (error) {
    res.json({
      message: '✅ API is running...',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: 'error',
      error: error.message,
      version: '2.0.4'
    });
  }
});

// ===== CORS Test Route =====
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'No origin header',
    method: req.method,
    version: '2.0.4',
    corsHeaders: {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    },
    buildId: Date.now()
  });
});

// ===== Environment Test Route =====
app.get('/env-test', (req, res) => {
  res.json({
    message: 'Environment variables test',
    mongoUriExists: !!process.env.MONGO_URI,
    mongoUriLength: process.env.MONGO_URI ? process.env.MONGO_URI.length : 0,
    mongoUriPreview: process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 20) + '...' : 'not set',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('MONGO'))
  });
});

// ===== API Routes Test =====
app.get('/api-test', (req, res) => {
  res.json({
    message: 'API routes test',
    availableRoutes: [
      'GET /api/clients',
      'GET /api/invoices', 
      'GET /api/services',
      'GET /api/dashboard/stats',
      'GET /api/users',
      'GET /api/export/excel',
      'GET /api/export/test',
      'GET /api/fbr-invoices',
      'GET /api/tasks'
    ],
    timestamp: new Date().toISOString()
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