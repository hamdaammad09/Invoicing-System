const mongoose = require('mongoose');

const fbrApiSettingSchema = new mongoose.Schema({
  // FBR API Credentials
  clientId: { type: String, required: true },
  clientSecret: { type: String, required: true },
  apiUrl: { type: String, required: true },
  environment: { type: String, enum: ['production', 'sandbox'], default: 'sandbox' },
  
  // Seller Authentication
  sellerNTN: { type: String, required: true }, // Seller's NTN for FBR
  sellerSTRN: { type: String, required: true }, // Seller's STRN for FBR
  businessName: { type: String, required: true }, // Business name registered with FBR
  
  // Access Token Management
  accessToken: { type: String }, // FBR access token
  refreshToken: { type: String }, // FBR refresh token
  tokenExpiry: { type: Date }, // Token expiry date
  lastTokenRefresh: { type: Date }, // Last time token was refreshed
  
  // Authentication Status
  isAuthenticated: { type: Boolean, default: false },
  lastLoginAttempt: { type: Date },
  loginError: { type: String }, // Last login error message
  
  // API Configuration
  maxRetries: { type: Number, default: 3 },
  timeout: { type: Number, default: 30000 }, // 30 seconds
  
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
