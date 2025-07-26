// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Import your database connection
const connectDB = require('./config/db');

// Create Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add CORS debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// ===== Route Imports =====
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const fbrInvoiceRoutes = require('./routes/fbrInvoiceRoutes');
const userRoutes = require('./routes/userRoutes');
const apiSettingsRoutes = require('./routes/fbrApiSettingsRoutes');
const exportRoutes = require('./routes/exportRoutes');

// ===== Route Usage =====
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
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

module.exports = app; 
