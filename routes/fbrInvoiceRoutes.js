const express = require('express');
const router = express.Router();
const fbrInvoiceController = require('../controllers/fbrInvoiceController');

// FBR Invoice Routes
router.post('/', fbrInvoiceController.createFbrInvoice);
router.get('/', fbrInvoiceController.getFbrInvoices);
router.get('/summary', fbrInvoiceController.getFbrInvoiceSummary);
router.get('/pending', fbrInvoiceController.getPendingFbrInvoices); // NEW: Pending invoices
router.get('/:id', fbrInvoiceController.getFbrInvoiceById);
router.put('/:id', fbrInvoiceController.updateFbrInvoice);

// FBR API Settings Routes
router.get('/settings/api', fbrInvoiceController.getFbrApiSettings);     // NEW: Get API settings
router.post('/settings/api', fbrInvoiceController.saveFbrApiSettings);   // NEW: Save API settings

module.exports = router;
