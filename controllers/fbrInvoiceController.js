const FbrInvoice = require('../models/fbrInvoice');
const FbrApiSetting = require('../models/fbrApiSetting');
const fbrApiService = require('../utils/fbrApiService');
const Client = require('../models/client');
const axios = require('axios');

// Create a new FBR invoice submission
exports.createFbrInvoice = async (req, res) => {
  try {
    console.log('🔄 Creating FBR invoice with data:', req.body);
    
    // Validate required fields
    const { invoiceNumber, client, amount, items, hsCode, fbrEnvironment } = req.body;
    
    if (!client) {
      return res.status(400).json({ message: 'client is required' });
    }
    
    if (!amount) {
      return res.status(400).json({ message: 'amount is required' });
    }
    
    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `FBR-${Date.now()}`;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required and must not be empty' });
    }
    
    // Validate items have required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description) {
        return res.status(400).json({ message: `Item ${i + 1} description is required` });
      }
      if (!item.hsCode) {
        return res.status(400).json({ message: `Item ${i + 1} hsCode is required` });
      }
      if (!item.quantity) {
        return res.status(400).json({ message: `Item ${i + 1} quantity is required` });
      }
      if (!item.unitPrice) {
        return res.status(400).json({ message: `Item ${i + 1} unitPrice is required` });
      }
    }
    
    // Prepare the data with generated invoice number
    const fbrInvoiceData = {
      ...req.body,
      invoiceNumber: finalInvoiceNumber
    };
    
    const fbrInvoice = new FbrInvoice(fbrInvoiceData);
    await fbrInvoice.save();
    
    console.log('✅ FBR invoice created successfully:', fbrInvoice._id);
    res.status(201).json(fbrInvoice);
  } catch (error) {
    console.error('❌ Error creating FBR invoice:', error);
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

    // Validate required fields
    if (!clientId || !clientSecret || !apiUrl) {
      return res.status(400).json({ 
        message: 'Client ID, Client Secret, and API URL are required' 
      });
    }

    // Validate environment
    if (environment && !['sandbox', 'production'].includes(environment)) {
      return res.status(400).json({ 
        message: 'Environment must be either "sandbox" or "production"' 
      });
    }

    // Test the settings before saving
    const testSettings = { clientId, clientSecret, apiUrl, environment: environment || 'sandbox' };
    const testResult = await testFbrConnection(testSettings);
    
    if (!testResult.success) {
      return res.status(400).json({ 
        message: 'Failed to validate FBR API settings',
        error: testResult.error,
        details: 'Please check your Client ID, Client Secret, and API URL'
      });
    }

    const existing = await FbrApiSetting.findOne();
    if (existing) {
      existing.clientId = clientId;
      existing.clientSecret = clientSecret;
      existing.apiUrl = apiUrl;
      existing.environment = environment || 'sandbox';
      await existing.save();
      return res.json({ 
        message: 'Settings updated and validated successfully', 
        settings: existing,
        testResult: testResult
      });
    }

    const newSettings = new FbrApiSetting({ 
      clientId, 
      clientSecret, 
      apiUrl, 
      environment: environment || 'sandbox' 
    });
    await newSettings.save();
    
    res.status(201).json({ 
      message: 'Settings saved and validated successfully', 
      settings: newSettings,
      testResult: testResult
    });
  } catch (error) {
    console.error('❌ Error saving FBR settings:', error);
    res.status(400).json({ message: 'Failed to save settings', error: error.message });
  }
};

// Helper function to test FBR connection with provided settings
async function testFbrConnection(settings) {
  try {
    const response = await axios.post(`${settings.apiUrl}/auth/token`, {
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      grant_type: 'client_credentials'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    return {
      success: true,
      message: 'FBR API connection successful',
      environment: settings.environment,
      apiUrl: settings.apiUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Connection test failed',
      environment: settings.environment,
      apiUrl: settings.apiUrl
    };
  }
}

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

// ✅ NEW: Submit invoice to FBR API
exports.submitToFBR = async (req, res) => {
  try {
    const { id } = req.params;
    const fbrInvoice = await FbrInvoice.findById(id).populate('client');
    
    if (!fbrInvoice) {
      return res.status(404).json({ message: 'FBR Invoice not found' });
    }

    // Initialize FBR API service
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({ message: 'FBR API not configured' });
    }

    // Validate invoice before submission
    const validation = await fbrApiService.validateInvoice(fbrInvoice);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Invoice validation failed', 
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Submit to FBR
    const submission = await fbrApiService.submitInvoice(fbrInvoice);
    
    if (submission.success) {
      // Update invoice with FBR response
      fbrInvoice.fbrReference = submission.fbrReference;
      fbrInvoice.fbrSubmissionResponse = submission.fbrResponse;
      fbrInvoice.fbrSubmissionDate = submission.submissionDate;
      fbrInvoice.fbrStatus = 'submitted';
      fbrInvoice.submittedToFBR = true;
      fbrInvoice.status = 'pending';
      
      await fbrInvoice.save();
      
      res.json({
        message: 'Invoice submitted to FBR successfully',
        fbrReference: submission.fbrReference,
        invoice: fbrInvoice
      });
    } else {
      // Update invoice with error
      fbrInvoice.fbrErrorMessage = submission.error;
      fbrInvoice.fbrStatus = 'rejected';
      fbrInvoice.retryCount += 1;
      fbrInvoice.lastRetryDate = new Date();
      
      await fbrInvoice.save();
      
      res.status(400).json({
        message: 'Failed to submit invoice to FBR',
        error: submission.error,
        invoice: fbrInvoice
      });
    }
  } catch (error) {
    console.error('❌ Error submitting to FBR:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ NEW: Check FBR invoice status
exports.checkFBRStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fbrInvoice = await FbrInvoice.findById(id);
    
    if (!fbrInvoice) {
      return res.status(404).json({ message: 'FBR Invoice not found' });
    }

    if (!fbrInvoice.fbrReference) {
      return res.status(400).json({ message: 'Invoice not submitted to FBR yet' });
    }

    // Initialize FBR API service
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({ message: 'FBR API not configured' });
    }

    // Check status from FBR
    const statusCheck = await fbrApiService.checkInvoiceStatus(fbrInvoice.fbrReference);
    
    if (statusCheck.success) {
      // Update invoice status
      fbrInvoice.fbrStatus = statusCheck.status;
      fbrInvoice.fbrSubmissionResponse = statusCheck.details;
      
      if (statusCheck.status === 'accepted') {
        fbrInvoice.status = 'accepted';
      } else if (statusCheck.status === 'rejected') {
        fbrInvoice.status = 'rejected';
      }
      
      await fbrInvoice.save();
      
      res.json({
        message: 'Status updated successfully',
        status: statusCheck.status,
        invoice: fbrInvoice
      });
    } else {
      res.status(400).json({
        message: 'Failed to check FBR status',
        error: statusCheck.error
      });
    }
  } catch (error) {
    console.error('❌ Error checking FBR status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ NEW: Test FBR API connection
exports.testFBRConnection = async (req, res) => {
  try {
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({ 
        message: 'FBR API not configured',
        error: 'Please configure FBR API settings first'
      });
    }

    const testResult = await fbrApiService.testConnection();
    
    if (testResult.success) {
      res.json({
        message: 'FBR API connection successful',
        ...testResult
      });
    } else {
      res.status(400).json({
        message: 'FBR API connection failed',
        ...testResult
      });
    }
  } catch (error) {
    console.error('❌ Error testing FBR connection:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ NEW: Validate invoice data for FBR
exports.validateInvoiceForFBR = async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Initialize FBR API service
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({ message: 'FBR API not configured' });
    }

    const validation = await fbrApiService.validateInvoice(invoiceData);
    
    res.json({
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    });
  } catch (error) {
    console.error('❌ Error validating invoice:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ✅ NEW: Get FBR invoice statistics
exports.getFBRStats = async (req, res) => {
  try {
    const [total, pending, submitted, accepted, rejected] = await Promise.all([
      FbrInvoice.countDocuments(),
      FbrInvoice.countDocuments({ fbrStatus: 'pending' }),
      FbrInvoice.countDocuments({ fbrStatus: 'submitted' }),
      FbrInvoice.countDocuments({ fbrStatus: 'accepted' }),
      FbrInvoice.countDocuments({ fbrStatus: 'rejected' })
    ]);

    res.json({
      total,
      pending,
      submitted,
      accepted,
      rejected,
      successRate: total > 0 ? ((accepted / total) * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Clear FBR API settings
exports.clearFbrApiSettings = async (req, res) => {
  try {
    await FbrApiSetting.deleteMany({});
    res.json({ message: 'FBR API settings cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear settings', error: error.message });
  }
};
