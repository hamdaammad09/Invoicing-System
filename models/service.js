const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
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

module.exports = mongoose.model('Service', serviceSchema);