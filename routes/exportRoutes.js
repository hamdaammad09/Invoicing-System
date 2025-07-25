const express = require('express');
const router = express.Router();

// Ensure correct path and function names
const {
  exportInvoicesToExcel,
  exportInvoicesToPDF
} = require('../controllers/exportController');

// Define routes
router.get('/excel', exportInvoicesToExcel);
router.get('/pdf', exportInvoicesToPDF);

module.exports = router;
