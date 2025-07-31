const express = require('express');
const router = express.Router();
const fbrApiSettingController = require('../controllers/fbrApiSettingController');

// FBR API Settings Routes
router.get('/', fbrApiSettingController.getApiSettings);
router.post('/', fbrApiSettingController.saveApiSettings);

module.exports = router;
