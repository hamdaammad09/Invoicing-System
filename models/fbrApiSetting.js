const mongoose = require('mongoose');

const fbrApiSettingSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  apiUrl: { type: String, required: true },
  environment: { type: String, enum: ['production', 'sandbox'], default: 'sandbox' },
}, {
  timestamps: true
});

module.exports = mongoose.model('FbrApiSetting', fbrApiSettingSchema);
