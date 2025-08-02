const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  // Multi-tenancy: sellerId for data isolation
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sellerSettings',
    required: true,
    index: true
  },

  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String,
    enum: [
      'Consultation',
      'Documentation',
      'Poultry',
      'Filing',
      'Registration',
      'Audit',
      'Compliance',
      'Advisory',
      'Processing',
      'Training',
      'Other'
    ]
  },
  category: {
    type: String,
    enum: [
      'Tax Consultancy',
      'Accounting Services',
      'Audit Services',
      'Business Registration',
      'FBR Services',
      'Legal Services',
      'Financial Advisory',
      'Import/Export Services',
      'Manufacturing Services',
      'Trading Services',
      'Other'
    ]
  },
  description: { 
    type: String 
  },
  price: { 
    type: Number,
    default: 0
  },
  duration: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'discontinued'], 
    default: 'active' 
  },
  // New fields for HS code integration
  hsCode: {
    type: String,
    default: ''
  },
  isProduct: {
    type: Boolean,
    default: false
  },

  // Created by (user who created this service)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Service metadata
  isTemplate: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  },

  createdDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedDate field before saving
serviceSchema.pre('save', function(next) {
  this.updatedDate = new Date();
  next();
});

// Update the updatedDate field before updating
serviceSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedDate: new Date() });
  next();
});

// Indexes for efficient queries
serviceSchema.index({ sellerId: 1, name: 1 });
serviceSchema.index({ sellerId: 1, status: 1 });
serviceSchema.index({ sellerId: 1, category: 1 });
serviceSchema.index({ sellerId: 1, type: 1 });

module.exports = mongoose.model('Service', serviceSchema);