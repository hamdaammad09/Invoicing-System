const User = require('../models/user');
const SellerSettings = require('../models/sellerSettings');

/**
 * Multi-tenancy middleware to handle seller data isolation
 * This middleware extracts the seller information from the authenticated user
 * and adds it to the request object for use in controllers
 */
const multiTenancyMiddleware = async (req, res, next) => {
  try {
    // Skip if no user is authenticated (public routes)
    if (!req.user) {
      return next();
    }

    const user = req.user;
    
    // For admin users, they can access all data (no seller isolation)
    if (user.role === 'admin') {
      req.sellerId = null;
      req.userRole = 'admin';
      req.canAccessAllData = true;
      return next();
    }

    // For sellers, their sellerId is their own seller settings ID
    if (user.role === 'seller') {
      // Find the seller settings for this user
      const sellerSettings = await SellerSettings.findOne({ 
        $or: [
          { _id: user.sellerId },
          { email: user.email }
        ]
      });

      if (!sellerSettings) {
        return res.status(403).json({
          success: false,
          message: 'Seller settings not found. Please configure your seller profile.'
        });
      }

      req.sellerId = sellerSettings._id;
      req.userRole = 'seller';
      req.sellerSettings = sellerSettings;
      req.canAccessAllData = false;
      return next();
    }

    // For buyers, their sellerId is the seller they belong to
    if (user.role === 'buyer') {
      if (!user.sellerId) {
        return res.status(403).json({
          success: false,
          message: 'Buyer account not properly linked to a seller.'
        });
      }

      req.sellerId = user.sellerId;
      req.userRole = 'buyer';
      req.canAccessAllData = false;
      return next();
    }

    // Unknown role
    return res.status(403).json({
      success: false,
      message: 'Invalid user role.'
    });

  } catch (error) {
    console.error('❌ Multi-tenancy middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in multi-tenancy middleware.'
    });
  }
};

/**
 * Middleware to ensure seller isolation for specific routes
 * This middleware ensures that the request has proper seller context
 */
const requireSellerContext = (req, res, next) => {
  if (!req.sellerId && !req.canAccessAllData) {
    return res.status(403).json({
      success: false,
      message: 'Seller context required for this operation.'
    });
  }
  next();
};

/**
 * Middleware to restrict access to admin only
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required for this operation.'
    });
  }
  next();
};

/**
 * Middleware to restrict access to sellers only
 */
const requireSeller = (req, res, next) => {
  if (req.userRole !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Seller access required for this operation.'
    });
  }
  next();
};

/**
 * Helper function to build seller-specific queries
 */
const buildSellerQuery = (req, additionalFilters = {}) => {
  const baseQuery = { ...additionalFilters };
  
  // If user can access all data (admin), don't filter by seller
  if (req.canAccessAllData) {
    return baseQuery;
  }
  
  // Otherwise, filter by seller
  return { ...baseQuery, sellerId: req.sellerId };
};

/**
 * Helper function to validate seller ownership
 */
const validateSellerOwnership = async (Model, documentId, req) => {
  try {
    const query = buildSellerQuery(req, { _id: documentId });
    const document = await Model.findOne(query);
    
    if (!document) {
      return {
        success: false,
        message: 'Document not found or access denied.',
        statusCode: 404
      };
    }
    
    return {
      success: true,
      document
    };
  } catch (error) {
    console.error('❌ Error validating seller ownership:', error);
    return {
      success: false,
      message: 'Error validating document ownership.',
      statusCode: 500
    };
  }
};

module.exports = {
  multiTenancyMiddleware,
  requireSellerContext,
  requireAdmin,
  requireSeller,
  buildSellerQuery,
  validateSellerOwnership
}; 