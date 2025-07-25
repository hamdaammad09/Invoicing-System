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
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true }, // linked invoice
  submittedToFBR: { type: Boolean, default: false } // for filtering pending ones
}, { timestamps: true });

module.exports = mongoose.model('FbrInvoice', fbrInvoiceSchema);
