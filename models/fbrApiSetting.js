const mongoose = require('mongoose');

const fbrApiSettingSchema = new mongoose.Schema({
  // FBR API Credentials
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  apiUrl: { type: String, required: true },
  environment: { type: String, enum: ['production', 'sandbox'], default: 'sandbox' },
  
  // Seller Authentication
  sellerNTN: { type: String, required: true },
  sellerSTRN: { type: String, required: true },
  businessName: { type: String, required: true },
  
  // Access Token Management
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date },
  lastTokenRefresh: { type: Date },
  
  // Authentication Status
  isAuthenticated: { type: Boolean, default: false },
  lastLoginAttempt: { type: Date },
  loginError: { type: String },
  
  // API Configuration
  maxRetries: { type: Number, default: 3 },
  timeout: { type: Number, default: 30000 },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'error'], 
    default: 'inactive' 
  }
}, {
  timestamps: true
});

// Index for quick lookups
fbrApiSettingSchema.index({ environment: 1, status: 1 });

module.exports = mongoose.model('FbrApiSetting', fbrApiSettingSchema);