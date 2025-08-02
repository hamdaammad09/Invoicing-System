const User = require('../models/user');
const roleTemplates = require('../config/roleTemplates');

// Allowed permission values (should match enum in model)
const VALID_PERMISSIONS = [
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
];

// ✅ Create a new user (with optional permissions)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions = [] } = req.body;

    // Validate permissions
    const invalidPermissions = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ message: `Invalid permissions: ${invalidPermissions.join(', ')}` });
    }

    const user = new User({ name, email, password, role, permissions });
    await user.save();
    res.status(201).json(user);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Get all users (with multi-tenancy support)
exports.getUsers = async (req, res) => {
  try {
    // Admins can see all users, others see filtered results
    let query = {};
    
    if (req.user && req.user.role === 'admin') {
      // Admin sees all users
      query = {};
    } else if (req.sellerId) {
      // Sellers see their own users and buyers
      query = { 
        $or: [
          { sellerId: req.sellerId },
          { role: 'admin' } // Admins are visible to all
        ]
      };
    }

    const users = await User.find(query).select('-password');
    res.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get a single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update a user's role and/or permissions
exports.updateUser = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    // If permissions are provided, validate them
    if (permissions) {
      const invalidPermissions = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({ message: `Invalid permissions: ${invalidPermissions.join(', ')}` });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all role templates
exports.getRoleTemplates = (req, res) => {
  res.json(roleTemplates);
};
