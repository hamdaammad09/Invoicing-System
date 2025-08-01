const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  // Updated buyer and seller references
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // References the Client collection
    required: true
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerSettings', // References the SellerSettings collection
    required: true
  },
  // Keep existing fields for backward compatibility
  buyerInfo: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    required: false, // Changed to false since we're using buyerId
  },
  sellerInfo: {
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId or String
    default: null,
  },
  items: [
    {
      product: { 
        type: String, 
        required: true,
        default: 'Product Description'
      }, // Product name
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
  // Removed totalAmount, discount, gst, incomeTax, finalAmount fields
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
    enum: ['paid', 'unpaid', 'pending', 'overdue', 'cancelled'],
    default: 'pending',
  },
  // Additional fields for form compatibility
  product: String,
  units: Number,
  unitPrice: Number,
  totalValue: Number,
  salesTax: Number,
  extraTax: {
    type: Number,
    default: 0,
  },
  finalValue: Number
});

// Pre-save hook to ensure items have descriptions
invoiceSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.items.forEach((item, index) => {
      if (!item.product || item.product.trim() === '') {
        item.product = `Item ${index + 1}`;
      }
    });
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);