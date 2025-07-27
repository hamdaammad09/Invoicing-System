const express = require('express');
const router = express.Router();

// Import your controllers
const {
  exportInvoicesToExcel,
  exportInvoicesToPDF
} = require('../controllers/exportController');

// Excel Export for Invoices - Use the controller
router.get('/excel', exportInvoicesToExcel);
router.get('/pdf', exportInvoicesToPDF);

// Additional route for invoices (if needed)
router.get('/invoices', exportInvoicesToExcel);

module.exports = router;