const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// TEMPORARY: Clear clients collection to remove old schema
router.delete('/clear', clientController.clearClientsCollection);

// Client routes
router.post('/', clientController.addClient);
router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientById);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

// Additional routes for buyer management
router.get('/buyers/all', clientController.getAllBuyers); // Get all clients as buyers
router.get('/buyers/active', clientController.getActiveBuyers); // Get only active buyers
router.post('/buyers/validate', clientController.validateBuyer); // Validate buyer data

module.exports = router;