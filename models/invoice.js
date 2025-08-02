const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Multi-tenancy: sellerId for data isolation
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sellerSettings',
    required: true,
    index: true
  },

  // Updated buyer and seller references
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client', // References the Client collection
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
      hsCode: {
        type: String,
        required: true,
        default: '0000.00.00'
      }, // HS Code for FBR compliance
      description: {
        type: String,
        default: function() {
          return this.product || 'Item Description';
        }
      } // Detailed description for FBR
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
  finalValue: Number,

  // Created by (user who created this invoice)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // FBR submission tracking
  fbrSubmitted: {
    type: Boolean,
    default: false
  },
  fbrSubmissionDate: {
    type: Date,
    default: null
  },
  fbrReference: {
    type: String,
    default: null
  }
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

// Indexes for efficient queries
invoiceSchema.index({ sellerId: 1, invoiceNumber: 1 });
invoiceSchema.index({ sellerId: 1, buyerId: 1 });
invoiceSchema.index({ sellerId: 1, status: 1 });
invoiceSchema.index({ sellerId: 1, issuedDate: -1 });
invoiceSchema.index({ sellerId: 1, fbrSubmitted: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);