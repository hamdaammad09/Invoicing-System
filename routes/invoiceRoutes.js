const express = require('express');
const router = express.Router();

const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
  updateInvoice // 👈 Import the update function
} = require('../controllers/invoiceController');

// POST /api/invoices - Create a new invoice
router.post('/', createInvoice);

// GET /api/invoices - Get all invoices
router.get('/', getInvoices);
// Test endpoint for CORS debugging (MUST come before /:id route)
router.get('/test-cors', (req, res) => {
  res.json({ 
    message: 'CORS test successful', 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin 
  });
});

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', getInvoiceById);

// PUT /api/invoices/:id - Update invoice by ID ✅
router.put('/:id', updateInvoice);

// DELETE /api/invoices/:id - Delete invoice by ID
router.delete('/:id', deleteInvoice);

// Optional: catch-all for unmatched routes
router.use((req, res) => {
  res.status(404).json({ message: 'Route Not Found' });
});

module.exports = router;
