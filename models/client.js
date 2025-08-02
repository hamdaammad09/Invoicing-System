const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Multi-tenancy: sellerId for data isolation
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sellerSettings',
    required: true,
    index: true // For efficient queries
  },

  // Buyer information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  buyerSTRN: {
    type: String,
    required: true,
    trim: true
  },
  buyerNTN: {
    type: String,
    required: true,
    trim: true
  },
  truckNo: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },

  // Additional buyer information
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  contactPerson: {
    type: String,
    trim: true
  },

  // Status management
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  // Business type and category
  businessType: {
    type: String,
    enum: ['manufacturing', 'trading', 'services', 'retail', 'wholesale', 'other'],
    default: 'other'
  },

  // Notes and metadata
  notes: {
    type: String,
    trim: true
  },

  // FBR registration status
  fbrRegistered: {
    type: Boolean,
    default: true
  },

  // Created by (user who added this buyer)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
clientSchema.index({ sellerId: 1, companyName: 1 });
clientSchema.index({ sellerId: 1, status: 1 });
clientSchema.index({ sellerId: 1, buyerNTN: 1 });

// Ensure unique buyer NTN within a seller's scope
clientSchema.index({ sellerId: 1, buyerNTN: 1 }, { unique: true });

module.exports = mongoose.model('Client', clientSchema);