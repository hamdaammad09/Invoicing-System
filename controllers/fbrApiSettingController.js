const FbrApiSettings = require('../models/fbrApiSettings');

// Get FBR API Settings (only one should exist)
exports.getApiSettings = async (req, res) => {
  try {
    const settings = await FbrApiSettings.findOne();
    if (!settings) return res.status(404).json({ message: 'FBR API settings not found' });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or Update FBR API Settings
exports.saveApiSettings = async (req, res) => {
  try {
    const existingSettings = await FbrApiSettings.findOne();

    if (existingSettings) {
      // Update
      const updatedSettings = await FbrApiSettings.findByIdAndUpdate(
        existingSettings._id,
        req.body,
        { new: true }
      );
      res.json(updatedSettings);
    } else {
      // Create new
      const newSettings = new FbrApiSettings(req.body);
      await newSettings.save();
      res.status(201).json(newSettings);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
