const Service = require('../models/service');
const { findHSCode } = require('../utils/hsCodeDatabase');

// Create a new service
exports.createService = async (req, res) => {
  try {
    console.log('🚀 Creating service with data:', req.body);
    
    // Validate required fields
    const { name, type, category } = req.body;
    if (!name || !type || !category) {
      return res.status(400).json({ 
        message: 'Name, type, and category are required fields' 
      });
    }
    
    // Auto-assign HS code if service involves products
    let serviceData = { ...req.body };
    if (serviceData.isProduct && serviceData.description) {
      const hsCode = findHSCode(serviceData.description);
      if (hsCode && hsCode !== '9983.99.00') {
        serviceData.hsCode = hsCode;
        console.log('🔍 Auto-assigned HS code:', hsCode, 'for description:', serviceData.description);
      }
    }
    
    const service = new Service(serviceData);
    await service.save();
    
    console.log('✅ Service created successfully:', service._id);
    res.status(201).json(service);
  } catch (error) {
    console.error('❌ Create service error:', error);
    res.status(400).json({ 
      message: 'Failed to create service',
      error: error.message 
    });
  }
};

// Get all services
exports.getServices = async (req, res) => {
  try {
    console.log('🚀 Fetching all services...');
    
    const services = await Service.find()
      .sort({ createdDate: -1 });
    
    console.log('✅ Services found:', services.length);
    res.json(services);
  } catch (error) {
    console.error('❌ getServices error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services',
      error: error.message 
    });
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🚀 Fetching service by ID:', id);
    
    const service = await Service.findById(id);
    if (!service) {
      console.log('❌ Service not found:', id);
      return res.status(404).json({ message: 'Service not found' });
    }
    
    console.log('✅ Service found:', service._id);
    res.json(service);
  } catch (error) {
    console.error('❌ getServiceById error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch service',
      error: error.message 
    });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🚀 Updating service:', id, 'with data:', req.body);
    
    // Auto-assign HS code if service involves products and description changed
    let updateData = { ...req.body };
    if (updateData.isProduct && updateData.description) {
      const hsCode = findHSCode(updateData.description);
      if (hsCode && hsCode !== '9983.99.00') {
        updateData.hsCode = hsCode;
        console.log('🔍 Auto-assigned HS code:', hsCode, 'for description:', updateData.description);
      }
    }
    
    const service = await Service.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!service) {
      console.log('❌ Service not found for update:', id);
      return res.status(404).json({ message: 'Service not found' });
    }
    
    console.log('✅ Service updated successfully:', service._id);
    res.json(service);
  } catch (error) {
    console.error('❌ Update service error:', error);
    res.status(400).json({ 
      message: 'Failed to update service',
      error: error.message 
    });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🚀 Deleting service:', id);
    
    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      console.log('❌ Service not found for deletion:', id);
      return res.status(404).json({ message: 'Service not found' });
    }
    
    console.log('✅ Service deleted successfully:', id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('❌ Delete service error:', error);
    res.status(500).json({ 
      message: 'Failed to delete service',
      error: error.message 
    });
  }
};

// Get services by category
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    console.log('🚀 Fetching services by category:', category);
    
    const services = await Service.find({ category })
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${services.length} services in category: ${category}`);
    res.json(services);
  } catch (error) {
    console.error('❌ getServicesByCategory error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services by category',
      error: error.message 
    });
  }
};

// Get services by type
exports.getServicesByType = async (req, res) => {
  try {
    const { type } = req.params;
    console.log('🚀 Fetching services by type:', type);
    
    const services = await Service.find({ type })
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${services.length} services of type: ${type}`);
    res.json(services);
  } catch (error) {
    console.error('❌ getServicesByType error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services by type',
      error: error.message 
    });
  }
};

// Get services by status
exports.getServicesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    console.log('🚀 Fetching services by status:', status);
    
    const services = await Service.find({ status })
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${services.length} services with status: ${status}`);
    res.json(services);
  } catch (error) {
    console.error('❌ getServicesByStatus error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch services by status',
      error: error.message 
    });
  }
};

// Get service statistics
exports.getServiceStats = async (req, res) => {
  try {
    console.log('🚀 Fetching service statistics...');
    
    const [
      totalServices,
      activeServices,
      productServices,
      servicesWithHSCodes
    ] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ status: 'active' }),
      Service.countDocuments({ isProduct: true }),
      Service.countDocuments({ hsCode: { $ne: '' } })
    ]);
    
    const stats = {
      total: totalServices,
      active: activeServices,
      products: productServices,
      withHSCodes: servicesWithHSCodes
    };
    
    console.log('✅ Service statistics:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ getServiceStats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch service statistics',
      error: error.message 
    });
  }
};

// Search services
exports.searchServices = async (req, res) => {
  try {
    const { query } = req.query;
    console.log('🚀 Searching services with query:', query);
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        message: 'Search query must be at least 2 characters long' 
      });
    }
    
    const services = await Service.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { type: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdDate: -1 });
    
    console.log(`✅ Found ${services.length} services matching query: ${query}`);
    res.json(services);
  } catch (error) {
    console.error('❌ searchServices error:', error);
    res.status(500).json({ 
      message: 'Failed to search services',
      error: error.message 
    });
  }
};
