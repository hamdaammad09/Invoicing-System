// api/index.js
const app = require('../app');

// Add a test route to check if the main app is working
app.get('/api-test-debug', (req, res) => {
  res.json({
    message: 'API debug test',
    routes: [
      '/api/clients',
      '/api/services', 
      '/api/tasks',
      '/api/dashboard',
      '/api/invoices'
    ],
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

// Test HS codes route
app.get('/test-hscodes', (req, res) => {
  const { findHSCode } = require('../utils/hsCodeDatabase');
  
  const testResults = {
    'poultry meal': findHSCode('poultry meal'),
    'poultry oil': findHSCode('poultry oil'),
    'chicken meal': findHSCode('chicken meal'),
    'chicken oil': findHSCode('chicken oil'),
    'poultry': findHSCode('poultry'),
    'meal': findHSCode('meal'),
    'oil': findHSCode('oil')
  };
  
  res.json({
    message: 'HS Code test results',
    testResults,
    timestamp: new Date().toISOString()
  });
});

// Test FBR invoice data structure
app.get('/test-fbr-data', async (req, res) => {
  try {
    const Invoice = require('../models/invoice');
    const invoices = await Invoice.find()
      .populate('buyerId', 'companyName buyerNTN buyerSTRN')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN')
      .limit(3);
    
    const testData = invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber,
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
      testData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: 'Failed to test FBR data structure'
    });
  }
});

module.exports = app;