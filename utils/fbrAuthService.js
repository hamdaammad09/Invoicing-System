const axios = require('axios');
const FbrApiSetting = require('../models/fbrApiSetting');

class FbrAuthService {
  constructor() {
    this.currentSettings = null;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Initialize authentication service
  async initialize() {
    try {
      console.log('🔐 Initializing FBR Authentication Service...');
      
      // Get active FBR settings
      this.currentSettings = await FbrApiSetting.findOne({ 
        status: 'active',
        isAuthenticated: true 
      });

      if (!this.currentSettings) {
        console.log('⚠️ No active FBR settings found');
        return false;
      }

      console.log('✅ FBR settings loaded:', {
        environment: this.currentSettings.environment,
        businessName: this.currentSettings.businessName,
        sellerNTN: this.currentSettings.sellerNTN
      });

      // Check if we have a valid token
      if (this.currentSettings.accessToken && this.currentSettings.tokenExpiry) {
        const now = new Date();
        if (this.currentSettings.tokenExpiry > now) {
          this.accessToken = this.currentSettings.accessToken;
          this.tokenExpiry = this.currentSettings.tokenExpiry;
          console.log('✅ Using existing valid access token');
          return true;
        } else {
          console.log('🔄 Access token expired, refreshing...');
          return await this.refreshToken();
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error initializing FBR auth service:', error);
      return false;
    }
  }

  // Authenticate seller with FBR
  async authenticateSeller(credentials) {
    try {
      console.log('🔐 Authenticating seller with FBR...');
      
      const { clientId, clientSecret, sellerNTN, sellerSTRN, businessName, environment = 'sandbox' } = credentials;

      // Validate required fields
      if (!clientId || !clientSecret || !sellerNTN || !sellerSTRN || !businessName) {
        throw new Error('Missing required authentication credentials');
      }

      console.log('📋 Using mock authentication for testing...');

      // Mock authentication response (for testing purposes)
      const mockAuthResponse = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600,
        token_type: 'Bearer'
      };

      // Get API URL based on environment (mock URLs for now)
      const apiUrl = environment === 'production' 
        ? 'https://iris.fbr.gov.pk/api/v1'
        : 'https://iris-sandbox.fbr.gov.pk/api/v1';

      console.log('✅ Mock seller authentication successful');

      // Calculate token expiry
      const expiresIn = mockAuthResponse.expires_in || 3600; // Default 1 hour
      const tokenExpiry = new Date(Date.now() + (expiresIn * 1000));

      // Save or update FBR settings
      let fbrSettings = await FbrApiSetting.findOne({ environment });
      
      if (!fbrSettings) {
        fbrSettings = new FbrApiSetting({
          clientId,
          clientSecret,
          apiUrl,
          environment,
          sellerNTN,
          sellerSTRN,
          businessName
        });
      } else {
        fbrSettings.clientId = clientId;
        fbrSettings.clientSecret = clientSecret;
        fbrSettings.apiUrl = apiUrl;
        fbrSettings.sellerNTN = sellerNTN;
        fbrSettings.sellerSTRN = sellerSTRN;
        fbrSettings.businessName = businessName;
      }

      // Update token information
      fbrSettings.accessToken = mockAuthResponse.access_token;
      fbrSettings.refreshToken = mockAuthResponse.refresh_token;
      fbrSettings.tokenExpiry = tokenExpiry;
      fbrSettings.lastTokenRefresh = new Date();
      fbrSettings.isAuthenticated = true;
      fbrSettings.status = 'active';
      fbrSettings.loginError = null;

      await fbrSettings.save();

      // Update current instance
      this.currentSettings = fbrSettings;
      this.accessToken = mockAuthResponse.access_token;
      this.tokenExpiry = tokenExpiry;

      console.log('✅ FBR authentication settings saved');
      return {
        success: true,
        message: 'Seller authenticated successfully (Mock Mode)',
        businessName,
        sellerNTN,
        environment
      };

    } catch (error) {
      console.error('❌ FBR authentication failed:', error.message);
      
      // Update error status
      if (this.currentSettings) {
        this.currentSettings.isAuthenticated = false;
        this.currentSettings.loginError = error.message;
        this.currentSettings.lastLoginAttempt = new Date();
        await this.currentSettings.save();
      }

      return {
        success: false,
        message: 'Authentication failed',
        error: error.message
      };
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      if (!this.currentSettings || !this.currentSettings.refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing FBR access token (Mock Mode)...');

      // Mock refresh response
      const mockRefreshResponse = {
        access_token: `mock_token_${Date.now()}`,
        refresh_token: `mock_refresh_${Date.now()}`,
        expires_in: 3600
      };

      const expiresIn = mockRefreshResponse.expires_in || 3600;
      const tokenExpiry = new Date(Date.now() + (expiresIn * 1000));

      // Update settings
      this.currentSettings.accessToken = mockRefreshResponse.access_token;
      this.currentSettings.refreshToken = mockRefreshResponse.refresh_token;
      this.currentSettings.tokenExpiry = tokenExpiry;
      this.currentSettings.lastTokenRefresh = new Date();

      await this.currentSettings.save();

      // Update current instance
      this.accessToken = mockRefreshResponse.access_token;
      this.tokenExpiry = tokenExpiry;

      console.log('✅ Access token refreshed successfully (Mock Mode)');
      return true;

    } catch (error) {
      console.error('❌ Token refresh failed:', error.message);
      return false;
    }
  }

  // Get current access token
  getAccessToken() {
    if (!this.accessToken || !this.tokenExpiry) {
      return null;
    }

    // Check if token is still valid
    if (new Date() >= this.tokenExpiry) {
      return null;
    }

    return this.accessToken;
  }

  // Check if authenticated
  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // Get seller information
  getSellerInfo() {
    if (!this.currentSettings) {
      return null;
    }

    return {
      businessName: this.currentSettings.businessName,
      sellerNTN: this.currentSettings.sellerNTN,
      sellerSTRN: this.currentSettings.sellerSTRN,
      environment: this.currentSettings.environment
    };
  }

  // Logout seller
  async logout() {
    try {
      if (this.currentSettings) {
        this.currentSettings.isAuthenticated = false;
        this.currentSettings.accessToken = null;
        this.currentSettings.refreshToken = null;
        this.currentSettings.tokenExpiry = null;
        await this.currentSettings.save();
      }

      this.accessToken = null;
      this.tokenExpiry = null;
      this.currentSettings = null;

      console.log('✅ Seller logged out successfully');
      return true;
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new FbrAuthService();