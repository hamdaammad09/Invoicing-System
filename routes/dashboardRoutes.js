const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Main dashboard route (what frontend expects)
router.get('/', dashboardController.getDashboardStats);

// Stats route (alternative)
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router; 