const express = require('express');
const router = express.Router();

// GET all services
router.get('/', async (req, res) => {
  try {
    // For now, return empty array until you set up database
    res.json([]);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new service
router.post('/', async (req, res) => {
  try {
    const { name, type, description, price, duration, status } = req.body;

    // For now, just return the data (you can add database later)
    const newService = {
      id: Date.now(),
      name,
      type,
      description,
      price,
      duration,
      status,
      createdAt: new Date()
    };

    res.status(201).json(newService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update service
router.put('/:id', async (req, res) => {
  try {
    // For now, just return success
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE service
router.delete('/:id', async (req, res) => {
  try {
    // For now, just return success
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
