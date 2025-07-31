// api/index.js
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: '✅ API is running...',
    status: 'healthy',
    environment: 'vercel',
    timestamp: new Date().toISOString()
  });
});

// Dashboard route
app.get('/api/dashboard', (req, res) => {
  res.json({
    totalClients: 0,
    totalInvoices: 0,
    totalTasks: 0,
    totalServices: 0,
    pendingTasks: 0,
    completedTasks: 0,
    recentInvoices: [],
    recentTasks: [],
    message: 'Dashboard data retrieved successfully'
  });
});

// Test route
app.get('/api-test', (req, res) => {
  res.json({
    message: 'API routes are working',
    availableRoutes: [
      '/api/dashboard',
      '/api/clients',
      '/api/services',
      '/api/tasks',
      '/api/invoices'
    ],
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      '/',
      '/api/dashboard',
      '/api-test',
      '/cors-test'
    ]
  });
});

module.exports = app;