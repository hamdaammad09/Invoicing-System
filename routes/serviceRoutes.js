const express = require('express');
const router = express.Router();

const {
  getServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
  getServicesByCategory,
  getServicesByType,
  getServicesByStatus,
  getServiceStats,
  searchServices
} = require('../controllers/serviceController');

// Basic CRUD operations
router.get('/', getServices);
router.post('/', createService);
router.get('/stats', getServiceStats);
router.get('/search', searchServices);
router.get('/:id', getServiceById);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

// Filter routes
router.get('/category/:category', getServicesByCategory);
router.get('/type/:type', getServicesByType);
router.get('/status/:status', getServicesByStatus);

module.exports = router;
