const mongoose = require('mongoose');

const sellerSettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'CONSULTANCY FORUM' },
  sellerNTN: { type: String, default: '[Your NTN Number]' },
  sellerSTRN: { type: String, default: '[Your STRN Number]' },
  address: { type: String, default: 'Professional Tax Services' },
  phone: { type: String, default: '[Your Phone Number]' },
  invoiceNumber: { type: String, default: '[Your Invoice Number]' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SellerSettings', sellerSettingsSchema); 