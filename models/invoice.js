const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  buyerInfo: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    required: true,
  },
  sellerInfo: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    default: null,
  },
  items: [
    {
      product: String, // Product name
      quantity: {
        type: Number,
        default: 1,
      },
      unitPrice: Number, // Unit Price Excluding GST
      totalValue: Number, // Total Value Excluding GST
      salesTax: Number, // Sales Tax @ 18%
      extraTax: {
        type: Number,
        default: 0,
      }, // Extra Tax
      finalValue: Number, // Value including GST & Extra Tax
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
