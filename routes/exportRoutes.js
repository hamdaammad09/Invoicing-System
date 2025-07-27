const express = require('express');
const router = express.Router();

// Import your controllers
const {
  exportInvoicesToExcel,
  exportInvoicesToPDF
} = require('../controllers/exportController');

// Test route to verify the export routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Export routes are working!', timestamp: new Date().toISOString() });
});

// Excel Export for Invoices - Use the controller
router.get('/excel', exportInvoicesToExcel);
router.get('/pdf', exportInvoicesToPDF);

// Additional route for invoices (if needed)
router.get('/invoices', exportInvoicesToExcel);

module.exports = router;