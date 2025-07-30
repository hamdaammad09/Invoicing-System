const express = require('express');
const router = express.Router();

// Import your controllers
const {
  exportInvoicesToExcel,
  exportInvoicesToPDF,
  exportInvoicesToCSV,
  testExport,
  testExcelGeneration,
  testCSVGeneration
} = require('../controllers/exportController');

// Test route to verify the export routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Export routes are working!', timestamp: new Date().toISOString() });
});

// Debug route to test export data structure
router.get('/debug', testExport);

// Test Excel generation with simple data
router.get('/test-excel', testExcelGeneration);

// Test CSV generation with simple data
router.get('/test-csv', testCSVGeneration);

// Excel Export for Invoices - Use the controller
router.get('/excel', exportInvoicesToExcel);

// CSV Export for Invoices (More reliable for cross-platform)
router.get('/csv', exportInvoicesToCSV);

// PDF Export for Invoices
router.get('/pdf', exportInvoicesToPDF);

// Additional route for invoices (if needed)
router.get('/invoices', exportInvoicesToExcel);

module.exports = router;