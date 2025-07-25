const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 🧑‍💻 CRUD routes
router.post('/', userController.createUser);         // Create user with role & permissions
router.get('/', userController.getUsers);            // Get all users
router.get('/:id', userController.getUserById);      // Get user by ID
router.put('/:id', userController.updateUser);       // Update user (role/permissions)
router.delete('/:id', userController.deleteUser);    // Delete user

// 🆕 Route: Get list of available permissions for frontend UI
router.get('/meta/permissions', (req, res) => {
  res.json({
    permissions: [
      'manage_users',
      'system_settings',
      'view_clients',
      'manage_clients',
      'view_invoices',
      'manage_invoices',
      'view_services',
      'manage_services',
      'fbr_submission',
      'view_dashboard'
    ]
  });
});

// 🆕 Route: Get list of available role templates for frontend UI
router.get('/meta/role-templates', userController.getRoleTemplates);

module.exports = router;
