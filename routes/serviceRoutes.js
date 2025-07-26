const express = require('express');
const router = express.Router();

const {
  getServices,
  createService,
  getServiceById,
  updateService,
  deleteService
} = require('../controllers/serviceController');

// GET all services
router.get('/', getServices);

// POST new service
router.post('/', createService);

// GET single service by ID
router.get('/:id', getServiceById);

// PUT update service
router.put('/:id', updateService);

// DELETE service
router.delete('/:id', deleteService);

module.exports = router;
