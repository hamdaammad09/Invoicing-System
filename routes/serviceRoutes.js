const express = require('express');
const router = express.Router();

// GET all services
router.get('/', async (req, res) => {
  try {
    // Your logic to fetch services from database
    // For testing, you can return empty array:
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new service
router.post('/', async (req, res) => {
  try {
    // Your logic to add service to database
    res.status(201).json({ message: 'Service added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;