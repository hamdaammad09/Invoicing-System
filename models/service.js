const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String }, // e.g., "Registration", "Tax Filing", "Audit", "Consulting", "VDS"
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: String }, // e.g., "3-5 days", "1 hour", "1 year"
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

module.exports = mongoose.model('Service', serviceSchema);