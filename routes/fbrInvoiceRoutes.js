const express = require('express');
const router = express.Router();
const fbrInvoiceController = require('../controllers/fbrInvoiceController');
const hsCodeValidator = require('../utils/hsCodeValidator');

// FBR Invoice Routes
router.post('/', fbrInvoiceController.createFbrInvoice);
router.get('/', fbrInvoiceController.getFbrInvoices);
router.get('/summary', fbrInvoiceController.getFbrInvoiceSummary);
router.get('/pending', fbrInvoiceController.getPendingFbrInvoices);
router.get('/stats', fbrInvoiceController.getFBRStats); // NEW: FBR statistics
router.get('/:id', fbrInvoiceController.getFbrInvoiceById);
router.put('/:id', fbrInvoiceController.updateFbrInvoice);

// FBR API Integration Routes
router.post('/:id/submit', fbrInvoiceController.submitToFBR); // NEW: Submit to FBR
router.get('/:id/status', fbrInvoiceController.checkFBRStatus); // NEW: Check FBR status
router.post('/validate', fbrInvoiceController.validateInvoiceForFBR); // NEW: Validate invoice
router.get('/test/connection', fbrInvoiceController.testFBRConnection); // NEW: Test FBR connection

// FBR API Settings Routes
router.get('/settings/api', fbrInvoiceController.getFbrApiSettings);
router.post('/settings/api', fbrInvoiceController.saveFbrApiSettings);

// HS Code Validation Routes
router.post('/validate/hs-code', (req, res) => {
  const { hsCode } = req.body;
  const validation = hsCodeValidator.validateFormat(hsCode);
  res.json(validation);
});

router.post('/suggest/hs-codes', (req, res) => {
  const { description } = req.body;
  const suggestions = hsCodeValidator.getSuggestions(description);
  res.json({ suggestions });
});

router.get('/hs-codes/common', (req, res) => {
  const codes = hsCodeValidator.getAllCommonCodes();
  res.json({ codes });
});

router.get('/hs-codes/category/:category', (req, res) => {
  const { category } = req.params;
  const codes = hsCodeValidator.getCodesByCategory(category);
  res.json({ category, codes });
});

module.exports = router;
