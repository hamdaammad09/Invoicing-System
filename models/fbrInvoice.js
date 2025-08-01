const mongoose = require('mongoose');

const fbrInvoiceSchema = new mongoose.Schema({
  // Invoice Reference
  invoiceNumber: { type: String, required: true },
  fbrInvoiceId: { type: String },
  
  // FBR Response Data
  uuid: { type: String },
  irn: { type: String },
  qrCode: { type: String },
  fbrReference: { type: String },
  
  // Buyer Information (Required - FBR needs this)
  buyerName: { type: String, required: true },
  buyerNTN: { type: String },
  buyerSTRN: { type: String },
  buyerAddress: { type: String, required: true },
  buyerPhone: { type: String },
  buyerEmail: { type: String },
  
  // Invoice Details
  totalAmount: { type: Number, required: true },
  salesTax: { type: Number, default: 0 },
  extraTax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  
  // Items array for FBR submission
  items: [{
    description: { type: String, required: true, default: 'Item Description' },
    hsCode: { type: String },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    salesTax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  }],
  
  // FBR Submission Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'accepted', 'rejected', 'pending'],
    default: 'draft'
  },
  
  // FBR API Response
  fbrSubmissionResponse: { type: Object },
  fbrSubmissionDate: { type: Date },
  fbrErrorMessage: { type: String },
  
  // Retry Management
  retryCount: { type: Number, default: 0 },
  lastRetryDate: { type: Date },
  
  // FBR API Settings used for this submission
  fbrEnvironment: { 
    type: String, 
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  },
  fbrClientId: { type: String },
  
  // Linked Data (for internal reference)
  originalInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  
  // Metadata
  notes: { type: String },
  tags: [{ type: String }]
  
}, { timestamps: true });

// Indexes for performance
fbrInvoiceSchema.index({ invoiceNumber: 1 });
fbrInvoiceSchema.index({ fbrReference: 1 });
fbrInvoiceSchema.index({ status: 1 });
fbrInvoiceSchema.index({ fbrEnvironment: 1 });

module.exports = mongoose.model('FbrInvoice', fbrInvoiceSchema);