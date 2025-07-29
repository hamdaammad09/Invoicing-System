const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
  companyName: { type: String, required: true, default: 'HS Softworks' },
  name: { type: String }, // Optional: contact person or owner
  sellerNTN: { type: String, required: true, default: '[Your NTN Number]' },
  sellerSTRN: { type: String, required: true, default: '[Your STRN Number]' },
  address: { type: String, required: true, default: 'Professional Tax Services' },
  phone: { type: String, required: true, default: '[Your Phone Number]' },
  email: { type: String },
  invoiceNumber: { type: String, default: '[Your Invoice Number]' },

  // FBR API credentials (for e-invoicing integration)
  fbrClientId: { type: String },
  fbrClientSecret: { type: String },
  fbrApiUrl: { type: String },
  fbrEnvironment: { type: String, enum: ['sandbox', 'production'], default: 'sandbox' },

  // Optional business info
  businessName: { type: String },
  businessAddress: { type: String },

  // Status and metadata
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  notes: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Pre-save middleware to update the updatedAt field
sellerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Seller', sellerSchema);