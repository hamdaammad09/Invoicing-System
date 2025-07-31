const express = require('express');
const router = express.Router();

const {
  loginSeller,
  getAuthStatus,
  logoutSeller,
  testFbrConnection,
  getSellerInfo
} = require('../controllers/fbrAuthController');

// FBR Authentication Routes

// Seller login to FBR
router.post('/login', loginSeller);

// Check authentication status
router.get('/status', getAuthStatus);

// Seller logout from FBR
router.post('/logout', logoutSeller);

// Test FBR connection
router.get('/test-connection', testFbrConnection);

// Get seller information
router.get('/seller-info', getSellerInfo);

module.exports = router; 