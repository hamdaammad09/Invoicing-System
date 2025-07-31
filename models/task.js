const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  dueDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  // New fields for FBR integration
  taskType: {
    type: String,
    enum: [
      'general',
      'fbr_submission',
      'fbr_compliance',
      'invoice_creation',
      'client_communication',
      'document_preparation',
      'tax_filing',
      'audit_preparation',
      'hs_code_assignment',
      'export_documentation'
    ],
    default: 'general',
  },
  fbrReference: {
    type: String,
    default: '',
  },
  invoiceNumber: {
    type: String,
    default: '',
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedDate field before saving
taskSchema.pre('save', function(next) {
  this.updatedDate = new Date();
  next();
});

// Update the updatedDate field before updating
taskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedDate: new Date() });
  next();
});

module.exports = mongoose.model('Task', taskSchema); 