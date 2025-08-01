const express = require('express');
const router = express.Router();
const { generateInvoicePDF, generateMultipleInvoicesPDF, generateFbrInvoicePDF } = require('../controllers/pdfController');

// Generate PDF for a single invoice
router.get('/invoice/:invoiceId', generateInvoicePDF);

// Generate FBR-specific invoice PDF
router.get('/fbr-invoice/:invoiceNumber', generateFbrInvoicePDF);

// Generate PDF for multiple invoices
router.post('/invoices', generateMultipleInvoicesPDF);

module.exports = router; 