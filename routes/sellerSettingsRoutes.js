const express = require('express');
const router = express.Router();
const { getSellerSettings, updateSellerSettings, createSellerSettings } = require('../controllers/sellerSettingsController');

// Get seller settings
router.get('/', getSellerSettings);

// Create new seller settings
router.post('/', createSellerSettings);

// Update seller settings
router.put('/', updateSellerSettings);

module.exports = router; 