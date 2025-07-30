const express = require('express');
const router = express.Router();
const fbrInvoiceController = require('../controllers/fbrInvoiceController');

// FBR API Settings Routes
router.get('/', fbrInvoiceController.getFbrApiSettings);
router.post('/', fbrInvoiceController.saveFbrApiSettings);
router.delete('/', fbrInvoiceController.clearFbrApiSettings);
router.get('/test', fbrInvoiceController.testFBRConnection);

module.exports = router;
