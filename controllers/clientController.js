const Client = require('../models/client');
const { ObjectId } = require('mongodb');
const { buildSellerQuery, validateSellerOwnership } = require('../middleware/multiTenancyMiddleware');

// TEMPORARY: Clear clients collection to remove old schema
exports.clearClientsCollection = async (req, res) => {
  try {
    // Only allow admin to clear collection
    if (req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required to clear collection.' 
      });
    }

    // Drop the entire collection to remove old schema
    await Client.collection.drop();
    console.log('✅ Clients collection dropped successfully');
    res.json({ 
      success: true,
      message: 'Clients collection cleared successfully. Old schema removed.' 
    });
  } catch (error) {
    console.error('❌ Error clearing collection:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clear collection' 
    });
  }
};

// Add new client (buyer)
exports.addClient = async (req, res) => {
  try {
    console.log('📝 Adding new client with seller isolation:', {
      sellerId: req.sellerId,
      userRole: req.userRole
    });

    // Ensure seller context
    if (!req.sellerId && !req.canAccessAllData) {
      return res.status(403).json({
        success: false,
        message: 'Seller context required to add clients.'
      });
    }

    let id = new ObjectId();
    const clientData = {
      ...req.body,
      id: id.toString(),
      sellerId: req.sellerId, // Add seller isolation
      createdBy: req.user._id // Track who created this client
    };

    console.log('📋 Client data to save:', clientData);

    const client = new Client(clientData);
    const savedClient = await client.save();
    
    console.log('✅ Client added successfully:', savedClient._id);
    
    res.status(201).json({
      success: true,
      client: savedClient,
      message: 'Client added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding client:', error);
    
    if (error.code === 11000) {
      // This error code indicates a duplicate key error
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ 
        success: false,
        message: `A client with this ${field} already exists within your seller scope.` 
      });
    }
    
    res.status(400).json({ 
      success: false,
      message: 'Failed to add client. Please check the provided data.' 
    });
  }
};

// Get all clients (filtered by seller)
exports.getClients = async (req, res) => {
  try {
    console.log('📋 Fetching clients with seller isolation:', {
      sellerId: req.sellerId,
      userRole: req.userRole
    });

    // Build seller-specific query
    const query = buildSellerQuery(req);
    
    const clients = await Client.find(query)
      .sort({ companyName: 1 })
      .populate('createdBy', 'name email');

    console.log(`✅ Found ${clients.length} clients for seller`);

    res.status(200).json({
      success: true,
      clients: clients,
      count: clients.length
    });
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get one client (with seller ownership validation)
exports.getClientById = async (req, res) => {
  try {
    console.log('📋 Fetching client by ID with seller isolation:', req.params.id);

    const validation = await validateSellerOwnership(Client, req.params.id, req);
    
    if (!validation.success) {
      return res.status(validation.statusCode || 404).json({
        success: false,
        message: validation.message
      });
    }

    const client = validation.document;
    
    console.log('✅ Client found:', client._id);

    res.status(200).json({
      success: true,
      client: client
    });
  } catch (error) {
    console.error('❌ Error fetching client by ID:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Update client (with seller ownership validation)
exports.updateClient = async (req, res) => {
  try {
    console.log('📝 Updating client with seller isolation:', req.params.id);

    const validation = await validateSellerOwnership(Client, req.params.id, req);
    
    if (!validation.success) {
      return res.status(validation.statusCode || 404).json({
        success: false,
        message: validation.message
      });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    console.log('✅ Client updated successfully:', updatedClient._id);

    res.status(200).json({
      success: true,
      client: updatedClient,
      message: 'Client updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating client:', error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete client (with seller ownership validation)
exports.deleteClient = async (req, res) => {
  try {
    console.log('🗑️ Deleting client with seller isolation:', req.params.id);

    const validation = await validateSellerOwnership(Client, req.params.id, req);
    
    if (!validation.success) {
      return res.status(validation.statusCode || 404).json({
        success: false,
        message: validation.message
      });
    }

    await Client.findByIdAndDelete(req.params.id);
    
    console.log('✅ Client deleted successfully');

    res.status(200).json({ 
      success: true,
      message: "Client deleted successfully" 
    });
  } catch (error) {
    console.error('❌ Error deleting client:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get all clients as buyers (filtered by seller)
exports.getAllBuyers = async (req, res) => {
  try {
    console.log('📋 Fetching all buyers with seller isolation');

    // Build seller-specific query
    const query = buildSellerQuery(req);
    
    const buyers = await Client.find(query, 'companyName buyerSTRN buyerNTN truckNo address phone status businessType')
      .sort({ companyName: 1 });

    console.log(`✅ Found ${buyers.length} buyers for seller`);

    res.status(200).json({
      success: true,
      buyers: buyers,
      count: buyers.length
    });
  } catch (error) {
    console.error('❌ Error fetching buyers:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get only active buyers (filtered by seller)
exports.getActiveBuyers = async (req, res) => {
  try {
    console.log('📋 Fetching active buyers with seller isolation');

    // Build seller-specific query with active status
    const query = buildSellerQuery(req, { status: 'active' });
    
    const activeBuyers = await Client.find(query, 'companyName buyerSTRN buyerNTN truckNo address phone businessType')
      .sort({ companyName: 1 });

    console.log(`✅ Found ${activeBuyers.length} active buyers for seller`);

    res.status(200).json({
      success: true,
      buyers: activeBuyers,
      count: activeBuyers.length
    });
  } catch (error) {
    console.error('❌ Error fetching active buyers:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get buyer statistics for seller
exports.getBuyerStats = async (req, res) => {
  try {
    console.log('📊 Fetching buyer statistics with seller isolation');

    // Build seller-specific query
    const query = buildSellerQuery(req);
    
    const stats = await Client.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalBuyers: { $sum: 1 },
          activeBuyers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveBuyers: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          suspendedBuyers: {
            $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] }
          },
          fbrRegistered: {
            $sum: { $cond: ['$fbrRegistered', 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalBuyers: 0,
      activeBuyers: 0,
      inactiveBuyers: 0,
      suspendedBuyers: 0,
      fbrRegistered: 0
    };

    console.log('✅ Buyer statistics calculated:', result);

    res.status(200).json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('❌ Error fetching buyer statistics:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
