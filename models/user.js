const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },

  email: { 
    type: String, 
    required: true, 
    unique: true 
  },

  password: { 
    type: String, 
    required: true 
  }, // You should hash this in production

  role: { 
    type: String, 
    enum: ['admin', 'consultant', 'client'], // updated to match your templates
    default: 'client' 
  },

  // Stores permissions toggled in UI or set by role template
  permissions: {
    type: [String],
    default: [],
    enum: [
      'manage_users',
      'system_settings',
      'view_clients',
      'manage_clients',
      'view_invoices',
      'manage_invoices',
      'view_services',
      'manage_services',
      'fbr_submission',
      'view_dashboard',
      'view_own_invoices',
      'view_own_data',
      'download_documents'
    ]
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
