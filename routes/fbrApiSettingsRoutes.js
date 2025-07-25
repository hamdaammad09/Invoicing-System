const express = require('express');
const router = express.Router();

// Example GET route (temporary)
router.get('/', (req, res) => {
  res.send('🔧 FBR API Settings route active (placeholder)');
});

module.exports = router;
