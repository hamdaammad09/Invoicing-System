const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
};

// Connect to MongoDB
connectDB();

// Import routes
const clientRoutes = require('../routes/clientRoutes');
const invoiceRoutes = require('../routes/invoiceRoutes');
const taskRoutes = require('../routes/taskRoutes');
const serviceRoutes = require('../routes/serviceRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const exportRoutes = require('../routes/exportRoutes');
const fbrInvoiceRoutes = require('../routes/fbrInvoiceRoutes');
const fbrApiSettingsRoutes = require('../routes/fbrApiSettingsRoutes');
const sellerSettingsRoutes = require('../routes/sellerSettingsRoutes');
const userRoutes = require('../routes/userRoutes');
const pdfRoutes = require('../routes/pdfRoutes');

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: '✅ API is running...',
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: 'vercel'
  });
});

// CORS test route
app.get('/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working',
    cors: true,
    environment: 'vercel'
  });
});

// API routes
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/fbrinvoices', fbrInvoiceRoutes);
app.use('/api/fbr-api-settings', fbrApiSettingsRoutes);
app.use('/api/seller-settings', sellerSettingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pdf', pdfRoutes);

// Catch-all route for API testing
app.get('/api-test', (req, res) => {
  res.json({
    message: 'API routes are working',
    availableRoutes: [
      '/api/clients',
      '/api/invoices', 
      '/api/tasks',
      '/api/services',
      '/api/dashboard',
      '/api/export',
      '/api/fbrinvoices',
      '/api/fbr-api-settings',
      '/api/seller-settings',
      '/api/users',
      '/api/pdf'
    ],
    environment: 'vercel'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;