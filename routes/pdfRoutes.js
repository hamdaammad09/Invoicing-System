const express = require('express');
const router = express.Router();
const { generateInvoicePDF, generateMultipleInvoicesPDF } = require('../controllers/pdfController');

// Generate PDF for a single invoice
router.get('/invoice/:invoiceId', generateInvoicePDF);

// Generate PDF for multiple invoices
router.post('/invoices', generateMultipleInvoicesPDF);

module.exports = router; 