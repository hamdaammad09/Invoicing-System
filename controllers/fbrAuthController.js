const fbrAuthService = require('../utils/fbrAuthService');
const fbrApiService = require('../utils/fbrApiService');

// Seller login to FBR
exports.loginSeller = async (req, res) => {
  try {
    console.log('🔐 Seller login request received');
    
    const { clientId, clientSecret, sellerNTN, sellerSTRN, businessName, environment = 'sandbox' } = req.body;

    // Validate required fields
    if (!clientId || !clientSecret || !sellerNTN || !sellerSTRN || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clientId, clientSecret, sellerNTN, sellerSTRN, businessName'
      });
    }

    // Authenticate seller with FBR
    const authResult = await fbrAuthService.authenticateSeller({
      clientId,
      clientSecret,
      sellerNTN,
      sellerSTRN,
      businessName,
      environment
    });

    if (authResult.success) {
      console.log('✅ Seller login successful');
      res.json({
        success: true,
        message: 'Seller authenticated successfully with FBR',
        sellerInfo: {
          businessName: authResult.businessName,
          sellerNTN: authResult.sellerNTN,
          environment: authResult.environment
        }
      });
    } else {
      console.log('❌ Seller login failed:', authResult.error);
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: authResult.error
      });
    }

  } catch (error) {
    console.error('❌ Seller login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: error.message
    });
  }
};

// Check authentication status
exports.getAuthStatus = async (req, res) => {
  try {
    console.log('🔍 Checking FBR authentication status...');
    
    // Initialize authentication service
    await fbrAuthService.initialize();
    
    const isAuthenticated = fbrAuthService.isAuthenticated();
    const sellerInfo = fbrAuthService.getSellerInfo();

    if (isAuthenticated && sellerInfo) {
      console.log('✅ Seller is authenticated');
      res.json({
        success: true,
        isAuthenticated: true,
        sellerInfo,
        message: 'Seller is authenticated with FBR'
      });
    } else {
      console.log('⚠️ Seller is not authenticated');
      res.json({
        success: true,
        isAuthenticated: false,
        sellerInfo: null,
        message: 'Seller is not authenticated with FBR'
      });
    }

  } catch (error) {
    console.error('❌ Auth status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check authentication status',
      error: error.message
    });
  }
};

// Seller logout from FBR
exports.logoutSeller = async (req, res) => {
  try {
    console.log('🚪 Seller logout request received');
    
    const logoutResult = await fbrAuthService.logout();

    if (logoutResult) {
      console.log('✅ Seller logged out successfully');
      res.json({
        success: true,
        message: 'Seller logged out successfully from FBR'
      });
    } else {
      console.log('❌ Seller logout failed');
      res.status(500).json({
        success: false,
        message: 'Failed to logout seller'
      });
    }

  } catch (error) {
    console.error('❌ Seller logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: error.message
    });
  }
};

// Test FBR connection
exports.testFbrConnection = async (req, res) => {
  try {
    console.log('🧪 Testing FBR connection...');
    
    const connectionResult = await fbrApiService.testConnection();

    if (connectionResult.success) {
      console.log('✅ FBR connection test successful');
      res.json({
        success: true,
        message: 'FBR connection test successful',
        sellerInfo: connectionResult.sellerInfo,
        environment: connectionResult.environment
      });
    } else {
      console.log('❌ FBR connection test failed:', connectionResult.message);
      res.status(400).json({
        success: false,
        message: connectionResult.message,
        error: connectionResult.error
      });
    }

  } catch (error) {
    console.error('❌ FBR connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test FBR connection',
      error: error.message
    });
  }
};

// Get seller information
exports.getSellerInfo = async (req, res) => {
  try {
    console.log('📋 Getting seller information...');
    
    // Initialize authentication service
    await fbrAuthService.initialize();
    
    const sellerInfo = fbrAuthService.getSellerInfo();

    if (sellerInfo) {
      console.log('✅ Seller info retrieved');
      res.json({
        success: true,
        sellerInfo,
        message: 'Seller information retrieved successfully'
      });
    } else {
      console.log('⚠️ No seller info available');
      res.status(404).json({
        success: false,
        message: 'No seller information available. Please login first.'
      });
    }

  } catch (error) {
    console.error('❌ Get seller info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seller information',
      error: error.message
    });
  }
};