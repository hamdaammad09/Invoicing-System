const mongoose = require('mongoose');

const fbrInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true }, // e.g., "INV-001"
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  amount: { type: Number, required: true },
  submissionDate: { type: Date }, // optional: only set when submitted
  fbrReference: { type: String }, // e.g., "FBR-2025-001234"
  status: {
    type: String,
    enum: ['accepted', 'pending', 'rejected'],
    default: 'pending'
  },
  errorMessage: { type: String }, // for rejected invoices
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }, // linked invoice (optional)
  submittedToFBR: { type: Boolean, default: false }, // for filtering pending ones
  
  // NEW FIELDS FOR HS CODE AND FBR INTEGRATION
  hsCode: { 
    type: String,
    validate: {
      validator: function(v) {
        return /^\d{4}\.\d{2}\.\d{2}$/.test(v);
      },
      message: 'Invalid HS Code format. Use format: XXXX.XX.XX'
    }
  },
  fbrInvoiceId: { type: String }, // FBR system ka invoice ID
  fbrSubmissionResponse: { type: Object }, // Complete FBR response
  fbrSubmissionDate: { type: Date }, // When submitted to FBR
  fbrStatus: { 
    type: String, 
    enum: ['submitted', 'accepted', 'rejected', 'pending'],
    default: 'pending'
  },
  fbrErrorMessage: { type: String }, // FBR error details
  retryCount: { type: Number, default: 0 }, // Retry attempts
  lastRetryDate: { type: Date }, // Last retry timestamp
  
  // FBR API Settings used for this submission
  fbrEnvironment: { 
    type: String, 
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  },
  fbrClientId: { type: String }, // FBR Client ID used
  fbrApiUrl: { type: String }, // FBR API URL used
  
  // Invoice Details for FBR
  buyerNTN: { type: String },
  buyerSTRN: { type: String },
  sellerNTN: { type: String },
  sellerSTRN: { type: String },
  totalAmount: { type: Number },
  salesTax: { type: Number },
  extraTax: { type: Number },
  
  // Items array for FBR submission
  items: [{
    description: { type: String },
    hsCode: { type: String },
    quantity: { type: Number },
    unitPrice: { type: Number },
    totalValue: { type: Number },
    salesTax: { type: Number }
  }]
  
}, { timestamps: true });

module.exports = mongoose.model('FbrInvoice', fbrInvoiceSchema);