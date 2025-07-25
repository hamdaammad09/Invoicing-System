const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  buyerInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  sellerInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  items: [
    {
      name: String,
      price: Number,
      quantity: {
        type: Number,
        default: 1,
      },
    }
  ],
  gst: {
    type: Number,
    default: 0,
  },
  incomeTax: {
    type: Number,
    default: 0,
  },
  totalAmount: Number,
  discount: {
    type: Number,
    default: 0,
  },
  finalAmount: Number,
  digitalSignature: {
    type: String,
  },
  irn: {
    type: String,
  },
  qrCode: {
    type: String,
  },
  issuedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'pending'],
    default: 'unpaid',
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
