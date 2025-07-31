// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// Import your database connection
const connectDB = require('./config/db');

// Create Express app
const app = express();

// Connect to MongoDB (with better error handling for serverless)
let dbConnected = false;
let dbConnectionPromise = null;

const initializeDB = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().then(connected => {
      dbConnected = connected;
      console.log('Database connection status:', connected);
      return connected;
    }).catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      dbConnected = false;
      return false;
    });
  }
  return dbConnectionPromise;
};

// Initialize DB connection
initializeDB();

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  // Add cache-busting header
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// CORS configuration (simplified and optimized)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://hsoftworks-phi.vercel.app',
    'https://*.vercel.app' 
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Disposition']
}));

app.use(express.json());

const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const fbrInvoiceRoutes = require('./routes/fbrInvoiceRoutes');
const fbrAuthRoutes = require('./routes/fbrAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const apiSettingsRoutes = require('./routes/fbrApiSettingsRoutes');
const exportRoutes = require('./routes/exportRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const sellerSettingsRoutes = require('./routes/sellerSettingsRoutes');
const hsCodeRoutes = require('./routes/hsCodeRoutes');

app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/fbrinvoices', fbrInvoiceRoutes);
app.use('/api/fbr-auth', fbrAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fbr-api-settings', apiSettingsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/seller-settings', sellerSettingsRoutes);
app.use('/api/hscodes', hsCodeRoutes);

// ===== Health Check / Root Route =====
app.get('/', async (req, res) => {
  try {
    // Wait for database connection to complete
    const dbStatus = await initializeDB();
    
    res.json({
      message: '✅ API is running...',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: dbStatus ? 'connected' : 'disconnected',
      mongoUri: process.env.MONGO_URI ? 'set' : 'not set',
      version: '2.0.6',
      corsEnabled: true,
      deployment: 'fixed-issues',
      corsHeaders: {
        'Access-Control-Allow-Origin': 'https://hsoftworks-phi.vercel.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      },
      buildId: Date.now()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.json({
      message: '✅ API is running...',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: 'error',
      error: error.message,
      version: '2.0.6'
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
    version: '2.0.6',
    corsHeaders: {
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    },
    buildId: Date.now()
  });
});

// ===== Vercel Test Route =====
app.get('/vercel-test', (req, res) => {
  res.json({
    message: 'Vercel deployment is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI ? 'set' : 'not set',
    version: '2.0.6',
    deployment: 'fixed-issues'
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
    message: 'Tax Consultancy Backend API',
    version: '2.0.6',
    deployment: 'fixed-issues',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/clients',
      'GET /api/invoices',
      'GET /api/tasks',
      'GET /api/dashboard',
      'GET /api/services',
      'GET /api/fbrinvoices',
      'GET /api/users',
      'GET /api/fbr-api-settings',
      'GET /api/export',
      'GET /api/pdf',
      'GET /api/seller-settings',
      'GET /api/hscodes',
      'GET /api/export/csv',
      'GET /api/fbrinvoices/available-invoices',
      'GET /api/fbrinvoices/invoice/:invoiceNumber',
      'POST /api/fbrinvoices/create-from-invoice',
      'GET /api/fbrinvoices/generate-pdf/:invoiceNumber',
      'GET /api/fbrinvoices/data/:invoiceNumber'
    ],
    database: 'Connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== Test FBR Data Structure =====
app.get('/test-fbr-data', async (req, res) => {
  try {
    const Invoice = require('./models/invoice');
    const SellerSettings = require('./models/sellerSettings');
    const Client = require('./models/client');
    
    console.log('🔍 Testing FBR data structure...');
    
    // Check if we have any seller settings
    const sellers = await SellerSettings.find();
    console.log('📋 Found sellers:', sellers.length);
    console.log('📋 Sample seller:', sellers[0]);
    
    // Check if we have any clients
    const clients = await Client.find();
    console.log('📋 Found clients:', clients.length);
    console.log('📋 Sample client:', clients[0]);
    
    // Check invoices with relationships
    const invoices = await Invoice.find()
      .populate('buyerId', 'companyName buyerNTN buyerSTRN')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN')
      .limit(3);
    
    console.log('📋 Found invoices:', invoices.length);
    console.log('📋 Sample invoice:', invoices[0]);
    
    const testData = invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber,
      // Raw IDs
      buyerId: invoice.buyerId,
      sellerId: invoice.sellerId,
      // Client (seller) information
      clientName: invoice.sellerId?.companyName || 'Unknown Client',
      clientNTN: invoice.sellerId?.sellerNTN || '',
      clientSTRN: invoice.sellerId?.sellerSTRN || '',
      // Customer (buyer) information
      customerName: invoice.buyerId?.companyName || 'Unknown Customer',
      customerNTN: invoice.buyerId?.buyerNTN || '',
      customerSTRN: invoice.buyerId?.buyerSTRN || '',
      // Original fields
      buyerName: invoice.buyerId?.companyName || 'Unknown Buyer',
      sellerName: invoice.sellerId?.companyName || 'Unknown Seller'
    }));
    
    res.json({
      message: 'FBR Data Structure Test',
      summary: {
        sellersCount: sellers.length,
        clientsCount: clients.length,
        invoicesCount: invoices.length
      },
      sellers: sellers.map(s => ({ id: s._id, companyName: s.companyName })),
      clients: clients.map(c => ({ id: c._id, companyName: c.companyName })),
      testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test FBR data error:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to test FBR data structure'
    });
  }
});

// ===== Setup Sample Data =====
app.post('/setup-sample-data', async (req, res) => {
  try {
    const SellerSettings = require('./models/sellerSettings');
    const Client = require('./models/client');
    const Invoice = require('./models/invoice');
    
    console.log('🔧 Setting up sample data...');
    
    // Create a sample seller (your tax consultancy client)
    const sampleSeller = new SellerSettings({
      companyName: 'ABC Trading Company',
      sellerNTN: '1234567-8',
      sellerSTRN: '1234567890123',
      address: '123 Business Street, Karachi',
      phone: '+92-300-1234567',
      email: 'info@abctrading.com',
      status: 'active'
    });
    
    await sampleSeller.save();
    console.log('✅ Created sample seller:', sampleSeller.companyName);
    
    // Create a sample client (customer of the seller)
    const sampleClient = new Client({
      companyName: 'XYZ Manufacturing Ltd',
      buyerNTN: '8765432-1',
      buyerSTRN: '9876543210987',
      address: '456 Industrial Area, Lahore',
      phone: '+92-300-9876543',
      email: 'contact@xyzmanufacturing.com'
    });
    
    await sampleClient.save();
    console.log('✅ Created sample client:', sampleClient.companyName);
    
    // Update existing invoices to use these IDs
    const invoices = await Invoice.find();
    if (invoices.length > 0) {
      for (let invoice of invoices) {
        invoice.buyerId = sampleClient._id;
        invoice.sellerId = sampleSeller._id;
        await invoice.save();
      }
      console.log(`✅ Updated ${invoices.length} invoices with proper relationships`);
    }
    
    res.json({
      message: 'Sample data setup completed',
      seller: {
        id: sampleSeller._id,
        companyName: sampleSeller.companyName,
        sellerNTN: sampleSeller.sellerNTN
      },
      client: {
        id: sampleClient._id,
        companyName: sampleClient.companyName,
        buyerNTN: sampleClient.buyerNTN
      },
      invoicesUpdated: invoices.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Setup sample data error:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to setup sample data'
    });
  }
});

// ===== Test FBR Workflow =====
app.get('/test-fbr-workflow', async (req, res) => {
  try {
    const Invoice = require('./models/invoice');
    const FbrInvoice = require('./models/fbrInvoice');
    const SellerSettings = require('./models/sellerSettings');
    const Client = require('./models/client');
    
    console.log('🔍 Testing complete FBR workflow...');
    
    // 1. Check data structure
    const sellers = await SellerSettings.find();
    const clients = await Client.find();
    const invoices = await Invoice.find()
      .populate('buyerId', 'companyName buyerNTN buyerSTRN')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN')
      .limit(3);
    
    const fbrSubmissions = await FbrInvoice.find()
      .populate({
        path: 'invoice',
        populate: [
          { path: 'buyerId', select: 'companyName buyerNTN buyerSTRN' },
          { path: 'sellerId', select: 'companyName sellerNTN sellerSTRN' }
        ]
      });
    
    // 2. Test data transformation
    const testSubmissions = fbrSubmissions.map(submission => {
      const invoice = submission.invoice;
      const buyerName = invoice?.buyerId?.companyName || 'Unknown Buyer';
      const sellerName = invoice?.sellerId?.companyName || 'Unknown Seller';
      
      return {
        fbrInvoiceId: submission._id,
        invoiceNumber: submission.invoiceNumber,
        originalInvoiceId: invoice?._id || 'Not linked',
        buyerName: buyerName,
        sellerName: sellerName,
        clientName: sellerName, // For tax consultancy
        customerName: buyerName, // For tax consultancy
        amount: submission.amount,
        status: submission.status,
        fbrStatus: submission.fbrStatus
      };
    });
    
    // 3. Check for issues
    const issues = [];
    
    if (sellers.length === 0) {
      issues.push('No seller settings found - run /setup-sample-data');
    }
    
    if (clients.length === 0) {
      issues.push('No clients found - run /setup-sample-data');
    }
    
    if (invoices.length === 0) {
      issues.push('No invoices found');
    }
    
    const unlinkedSubmissions = fbrSubmissions.filter(s => !s.invoice);
    if (unlinkedSubmissions.length > 0) {
      issues.push(`${unlinkedSubmissions.length} FBR submissions not linked to invoices - run POST /api/fbrinvoices/submissions/fix`);
    }
    
    const unknownBuyers = testSubmissions.filter(s => s.buyerName === 'Unknown Buyer');
    const unknownSellers = testSubmissions.filter(s => s.sellerName === 'Unknown Seller');
    
    if (unknownBuyers.length > 0) {
      issues.push(`${unknownBuyers.length} submissions with unknown buyers`);
    }
    
    if (unknownSellers.length > 0) {
      issues.push(`${unknownSellers.length} submissions with unknown sellers`);
    }
    
    res.json({
      message: 'FBR Workflow Test Results',
      summary: {
        sellersCount: sellers.length,
        clientsCount: clients.length,
        invoicesCount: invoices.length,
        fbrSubmissionsCount: fbrSubmissions.length,
        linkedSubmissionsCount: fbrSubmissions.filter(s => s.invoice).length,
        unlinkedSubmissionsCount: unlinkedSubmissions.length
      },
      testSubmissions: testSubmissions,
      issues: issues,
      recommendations: [
        'If issues found, run: POST /setup-sample-data',
        'If unlinked submissions: POST /api/fbrinvoices/submissions/fix',
        'Test submissions: GET /api/fbrinvoices/submissions',
        'Test stats: GET /api/fbrinvoices/submissions/stats'
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ FBR workflow test error:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to test FBR workflow'
    });
  }
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