const express = require('express');
const router = express.Router();
const { getSellerSettings, updateSellerSettings } = require('../controllers/sellerSettingsController');

// Get seller settings
router.get('/', getSellerSettings);

// Update seller settings
router.put('/', updateSellerSettings);

module.exports = router; 