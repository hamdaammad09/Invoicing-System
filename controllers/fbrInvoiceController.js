const FbrInvoice = require('../models/fbrInvoice');
const FbrApiSetting = require('../models/fbrApiSetting'); // New model

// Create a new FBR invoice submission
exports.createFbrInvoice = async (req, res) => {
  try {
    const fbrInvoice = new FbrInvoice(req.body);
    await fbrInvoice.save();
    res.status(201).json(fbrInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all FBR invoices (with optional status filter)
exports.getFbrInvoices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const fbrInvoices = await FbrInvoice.find(filter)
      .populate('client')
      .populate('invoice')
      .sort({ submissionDate: -1 });
    res.json(fbrInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get all pending FBR invoices (not submitted to FBR)
exports.getPendingFbrInvoices = async (req, res) => {
  try {
    const pendingInvoices = await FbrInvoice.find({ status: 'pending' })
      .populate('client')
      .populate('invoice');
    res.json(pendingInvoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get saved FBR API settings
exports.getFbrApiSettings = async (req, res) => {
  try {
    const settings = await FbrApiSetting.findOne().sort({ updatedAt: -1 });
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve API settings' });
  }
};

// ✅ Save or update FBR API settings
exports.saveFbrApiSettings = async (req, res) => {
  try {
    const { clientId, clientSecret, apiUrl, environment } = req.body;

    const existing = await FbrApiSetting.findOne();
    if (existing) {
      existing.clientId = clientId;
      existing.clientSecret = clientSecret;
      existing.apiUrl = apiUrl;
      existing.environment = environment;
      await existing.save();
      return res.json({ message: 'Settings updated successfully', settings: existing });
    }

    const newSettings = new FbrApiSetting({ clientId, clientSecret, apiUrl, environment });
    await newSettings.save();
    res.status(201).json({ message: 'Settings saved successfully', settings: newSettings });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save settings', error: error.message });
  }
};

// Get summary counts
exports.getFbrInvoiceSummary = async (req, res) => {
  try {
    const [accepted, pending, rejected, total] = await Promise.all([
      FbrInvoice.countDocuments({ status: 'accepted' }),
      FbrInvoice.countDocuments({ status: 'pending' }),
      FbrInvoice.countDocuments({ status: 'rejected' }),
      FbrInvoice.countDocuments(),
    ]);
    res.json({ accepted, pending, rejected, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single FBR invoice
exports.getFbrInvoiceById = async (req, res) => {
  try {
    const fbrInvoice = await FbrInvoice.findById(req.params.id)
      .populate('client')
      .populate('invoice');
    if (!fbrInvoice) return res.status(404).json({ message: 'FBR Invoice not found' });
    res.json(fbrInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update (e.g., retry) an FBR invoice
exports.updateFbrInvoice = async (req, res) => {
  try {
    const fbrInvoice = await FbrInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fbrInvoice) return res.status(404).json({ message: 'FBR Invoice not found' });
    res.json(fbrInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
