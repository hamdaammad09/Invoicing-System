const express = require('express');
const router = express.Router();

const {
  getAvailableInvoiceNumbers,
  getInvoiceByNumber,
  createFbrInvoiceFromInvoice,
  getFbrSubmissions,
  getFbrSubmissionStats,
  fixFbrSubmissions,
  getPendingInvoices,
  getFbrInvoiceById,
  retryFbrSubmission
} = require('../controllers/fbrInvoiceController');

const {
  generateFbrInvoicePDF,
  getFbrInvoiceData
} = require('../controllers/fbrInvoiceGeneratorController');

// Get all available invoice numbers for FBR submission
router.get('/available-invoices', getAvailableInvoiceNumbers);

// Get invoice details by invoice number for FBR submission
router.get('/invoice/:invoiceNumber', getInvoiceByNumber);

// Create FBR invoice from existing invoice
router.post('/create-from-invoice', createFbrInvoiceFromInvoice);

// Get FBR invoice submissions
router.get('/submissions', getFbrSubmissions);

// Get FBR submission statistics
router.get('/submissions/stats', getFbrSubmissionStats);

// Fix existing FBR submissions with missing invoice links
router.post('/submissions/fix', fixFbrSubmissions);

// Get pending invoices (not yet submitted to FBR)
router.get('/pending', getPendingInvoices);

// Get FBR invoice by ID
router.get('/:id', getFbrInvoiceById);

// Retry FBR submission
router.post('/:id/retry', retryFbrSubmission);

// Generate FBR-compliant invoice PDF
router.get('/generate-pdf/:invoiceNumber', generateFbrInvoicePDF);

// Get FBR invoice data for frontend
router.get('/data/:invoiceNumber', getFbrInvoiceData);

module.exports = router;
