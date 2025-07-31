const express = require('express');
const router = express.Router();

const {
  getHSCode,
  getHSCodeSuggestions,
  validateHSCode,
  getAllHSCodes,
  autoComplete,
  testHSCodeDatabase
} = require('../controllers/hsCodeController');

// Get HS code for a description
router.get('/lookup', getHSCode);

// Get multiple suggestions for a description
router.get('/suggestions', getHSCodeSuggestions);

// Validate HS code format
router.get('/validate', validateHSCode);

// Get all available HS codes
router.get('/all', getAllHSCodes);

// Auto-complete for HS code descriptions
router.get('/autocomplete', autoComplete);

// Test HS code database
router.get('/test', testHSCodeDatabase);

module.exports = router; 