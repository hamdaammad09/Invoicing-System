const Service = require('../models/service');

// Create a new service
exports.createService = async (req, res) => {
  try {
    console.log('🚀 Creating service with data:', req.body);
    const service = new Service(req.body);
    await service.save();
    console.log('✅ Service created successfully:', service);
    res.status(201).json(service);
  } catch (error) {
    console.error('❌ Create service error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all services
exports.getServices = async (req, res) => {
  try {
    console.log('🚀 getServices called');
    // Try to get services from database
    const services = await Service.find();
    console.log('✅ Services found:', services.length);
    console.log('📋 Services data:', services.map(s => ({ name: s.name, type: s.type, status: s.status })));
    res.json(services);
  } catch (error) {
    console.error('❌ getServices error:', error);
    // Return empty array if database fails
    res.json([]);
  }
};

// Get a single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    console.error('❌ getServiceById error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  try {
    console.log('🚀 Updating service:', req.params.id, 'with data:', req.body);
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    console.log('✅ Service updated successfully:', service);
    res.json(service);
  } catch (error) {
    console.error('❌ Update service error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    console.log('✅ Service deleted successfully:', req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('❌ Delete service error:', error);
    res.status(500).json({ message: error.message });
  }
};
