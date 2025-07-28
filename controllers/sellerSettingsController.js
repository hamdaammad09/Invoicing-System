const SellerSettings = require('../models/sellerSettings');

// Get seller settings
const getSellerSettings = async (req, res) => {
  try {
    let settings = await SellerSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new SellerSettings();
      await settings.save();
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
    
    // Check if settings already exist
    const existingSettings = await SellerSettings.findOne();
    if (existingSettings) {
      return res.status(400).json({ error: 'Seller settings already exist. Use PUT to update.' });
    }
    
    // Create new settings
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

// Update seller settings
const updateSellerSettings = async (req, res) => {
  try {
    const { companyName, sellerNTN, sellerSTRN, address, phone, invoiceNumber } = req.body;
    
    let settings = await SellerSettings.findOne();
    
    if (!settings) {
      settings = new SellerSettings();
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

module.exports = {
  getSellerSettings,
  createSellerSettings,
  updateSellerSettings
}; 