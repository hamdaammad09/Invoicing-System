const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Basic CRUD operations
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Filter routes
router.get('/type/:type', taskController.getTasksByType);
router.get('/status/:status', taskController.getTasksByStatus);
router.get('/priority/:priority', taskController.getTasksByPriority);

module.exports = router; 