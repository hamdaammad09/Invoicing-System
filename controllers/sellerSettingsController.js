const SellerSettings = require('../models/sellerSettings');

// Get all seller settings
const getSellerSettings = async (req, res) => {
  try {
    const settings = await SellerSettings.find().sort({ createdAt: -1 });
    
    if (settings.length === 0) {
      return res.json([]);
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error getting seller settings:', error);
    res.status(500).json({ error: 'Failed to get seller settings' });
  }
};

// Create new seller settings
const createSellerSettings = async (req, res) => {
  try {
    const { companyName, sellerNTN, sellerSTRN, address, phone, invoiceNumber } = req.body;
    
    // Create new settings (allow multiple sellers)
    const settings = new SellerSettings({
      companyName,
      sellerNTN,
      sellerSTRN,
      address,
      phone,
      invoiceNumber
    });
    
    await settings.save();
    res.status(201).json(settings);
  } catch (error) {
    console.error('Error creating seller settings:', error);
    res.status(500).json({ error: 'Failed to create seller settings' });
  }
};

// Update specific seller settings by ID
const updateSellerSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, sellerNTN, sellerSTRN, address, phone, invoiceNumber } = req.body;
    
    const settings = await SellerSettings.findById(id);
    
    if (!settings) {
      return res.status(404).json({ error: 'Seller settings not found' });
    }
    
    // Update fields
    if (companyName) settings.companyName = companyName;
    if (sellerNTN) settings.sellerNTN = sellerNTN;
    if (sellerSTRN) settings.sellerSTRN = sellerSTRN;
    if (address) settings.address = address;
    if (phone) settings.phone = phone;
    if (invoiceNumber) settings.invoiceNumber = invoiceNumber;
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating seller settings:', error);
    res.status(500).json({ error: 'Failed to update seller settings' });
  }
};

// Delete seller settings by ID
const deleteSellerSettings = async (req, res) => {
  try {
    const { id } = req.params;
    
    const settings = await SellerSettings.findByIdAndDelete(id);
    
    if (!settings) {
      return res.status(404).json({ error: 'Seller settings not found' });
    }
    
    res.json({ message: 'Seller settings deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller settings:', error);
    res.status(500).json({ error: 'Failed to delete seller settings' });
  }
};

module.exports = {
  getSellerSettings,
  createSellerSettings,
  updateSellerSettings,
  deleteSellerSettings
}; 