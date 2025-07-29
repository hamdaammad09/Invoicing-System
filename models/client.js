const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  buyerSTRN: {
    type: String,
    required: true,
    trim: true
  },
  buyerNTN: {
    type: String,
    required: true,
    trim: true
  },
  truckNo: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);