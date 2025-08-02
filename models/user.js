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
    enum: ['admin', 'seller', 'buyer'], // Updated for multi-tenancy
    default: 'buyer' 
  },

  // Multi-tenancy: sellerId for data isolation
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sellerSettings',
    required: function() {
      return this.role === 'buyer'; // Buyers must belong to a seller
    }
  },

  // For sellers, this is their own seller settings ID
  // For buyers, this is the seller they belong to
  // For admins, this is null (they can see all data)

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
      'download_documents',
      'manage_seller_settings', // New permission for sellers
      'view_own_buyers', // New permission for sellers
      'manage_own_buyers' // New permission for sellers
    ]
  },

  // Status for account management
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // Last login tracking
  lastLogin: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index for efficient queries
userSchema.index({ sellerId: 1, role: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
