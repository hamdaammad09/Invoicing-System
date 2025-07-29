const express = require('express');
const router = express.Router();
const { getSellerSettings, updateSellerSettings, createSellerSettings, deleteSellerSettings } = require('../controllers/sellerSettingsController');

// Get all seller settings
router.get('/', getSellerSettings);

// Create new seller settings
router.post('/', createSellerSettings);

// Update specific seller settings by ID
router.put('/:id', updateSellerSettings);

// Delete specific seller settings by ID
router.delete('/:id', deleteSellerSettings);

module.exports = router; 