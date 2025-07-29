const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Get all invoices
router.get('/', invoiceController.getInvoices);

// Get available buyers for dropdown
router.get('/buyers/available', invoiceController.getAvailableBuyers);

// Get available sellers for dropdown
router.get('/sellers/available', invoiceController.getAvailableSellers);

// Debug endpoint to check invoice associations
router.get('/debug/associations', invoiceController.debugInvoices);

// Create new invoice
router.post('/', invoiceController.createInvoice);

// Get invoice by ID
router.get('/:id', invoiceController.getInvoiceById);

// Update invoice
router.put('/:id', invoiceController.updateInvoice);

// Delete invoice
router.delete('/:id', invoiceController.deleteInvoice);

// Generate PDF for specific invoice (original)
router.get('/:invoiceId/pdf-data', invoiceController.generateInvoicePDF);

// Get invoice with buyer/seller selection for PDF
router.get('/:invoiceId/pdf/:selectedBuyerId/:selectedSellerId', invoiceController.getInvoiceForPDF);

// Migration route to fix existing invoices
router.post('/migrate', invoiceController.migrateInvoices);

module.exports = router;
