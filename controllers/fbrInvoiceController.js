const FbrInvoice = require('../models/fbrInvoice');
const Invoice = require('../models/invoice');
const SellerSettings = require('../models/sellerSettings');
const fbrApiService = require('../utils/fbrApiService');

// Get all available invoice numbers for FBR submission
exports.getAvailableInvoiceNumbers = async (req, res) => {
  try {
    console.log('🔍 Fetching available invoices for FBR...');
    
    // Get invoices that haven't been submitted to FBR yet
    const invoices = await Invoice.find({ 
      fbrReference: { $exists: false } 
    })
    .populate('buyerId', 'companyName buyerNTN buyerSTRN')
    .populate('sellerId', 'companyName sellerNTN sellerSTRN')
    .select('invoiceNumber issuedDate finalValue buyerId sellerId')
    .sort({ issuedDate: -1 });

    console.log('📋 Found invoices:', invoices.length);
    console.log('📋 Sample invoice data:', invoices[0]);

    const invoiceOptions = invoices.map(invoice => {
      // For tax consultancy, sellers are the clients
      const clientName = invoice.sellerId?.companyName || 'Unknown Client';
      const clientNTN = invoice.sellerId?.sellerNTN || '';
      const clientSTRN = invoice.sellerId?.sellerSTRN || '';
      
      // Buyer is the customer of the seller
      const customerName = invoice.buyerId?.companyName || 'Unknown Customer';
      const customerNTN = invoice.buyerId?.buyerNTN || '';
      const customerSTRN = invoice.buyerId?.buyerSTRN || '';

      console.log(`📄 Invoice ${invoice.invoiceNumber}:`, {
        sellerId: invoice.sellerId,
        buyerId: invoice.buyerId,
        clientName,
        customerName
      });

      return {
        invoiceNumber: invoice.invoiceNumber,
        issuedDate: invoice.issuedDate,
        totalAmount: invoice.finalValue,
        // Display seller as client (since sellers are your tax consultancy clients)
        clientName: clientName,
        clientNTN: clientNTN,
        clientSTRN: clientSTRN,
        // Display buyer as customer
        customerName: customerName,
        customerNTN: customerNTN,
        customerSTRN: customerSTRN,
        // Keep original fields for backward compatibility
        buyerName: customerName,
        sellerName: clientName,
        buyerNTN: customerNTN,
        buyerSTRN: customerSTRN,
        sellerNTN: clientNTN,
        sellerSTRN: clientSTRN
      };
    });

    console.log('📋 Available invoice numbers for FBR:', invoiceOptions.length);

    res.json({
      success: true,
      invoices: invoiceOptions,
      count: invoiceOptions.length,
      message: 'Available invoice numbers retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting available invoice numbers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available invoice numbers',
      error: error.message
    });
  }
};

// Get invoice details by invoice number for FBR submission
exports.getInvoiceByNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required'
      });
    }

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('buyerId', 'companyName buyerNTN buyerSTRN address phone')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if already submitted to FBR
    if (invoice.fbrReference) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already submitted to FBR',
        fbrReference: invoice.fbrReference
      });
    }

    // Calculate totals from items
    const totalAmount = invoice.items.reduce((sum, item) => sum + (item.finalValue || 0), 0);
    const totalSalesTax = invoice.items.reduce((sum, item) => sum + (item.salesTax || 0), 0);
    const totalExtraTax = invoice.items.reduce((sum, item) => sum + (item.extraTax || 0), 0);

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.issuedDate,
      totalAmount: totalAmount,
      salesTax: totalSalesTax,
      extraTax: totalExtraTax,
      finalValue: invoice.finalValue,
      
      // Client details (seller is the tax consultancy client)
      clientName: invoice.sellerId?.companyName || '',
      clientNTN: invoice.sellerId?.sellerNTN || '',
      clientSTRN: invoice.sellerId?.sellerSTRN || '',
      clientAddress: invoice.sellerId?.address || '',
      clientPhone: invoice.sellerId?.phone || '',
      
      // Customer details (buyer is the customer of the seller)
      customerName: invoice.buyerId?.companyName || '',
      customerNTN: invoice.buyerId?.buyerNTN || '',
      customerSTRN: invoice.buyerId?.buyerSTRN || '',
      customerAddress: invoice.buyerId?.address || '',
      customerPhone: invoice.buyerId?.phone || '',
      
      // Keep original fields for backward compatibility
      buyerName: invoice.buyerId?.companyName || '',
      buyerNTN: invoice.buyerId?.buyerNTN || '',
      buyerSTRN: invoice.buyerId?.buyerSTRN || '',
      buyerAddress: invoice.buyerId?.address || '',
      buyerPhone: invoice.buyerId?.phone || '',
      
      sellerName: invoice.sellerId?.companyName || '',
      sellerNTN: invoice.sellerId?.sellerNTN || '',
      sellerSTRN: invoice.sellerId?.sellerSTRN || '',
      sellerAddress: invoice.sellerId?.address || '',
      sellerPhone: invoice.sellerId?.phone || '',
      
      // Items with HS codes
      items: invoice.items.map(item => ({
        description: item.product || item.description || '',
        hsCode: item.hsCode || '9983.99.00',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalValue: item.totalValue || 0,
        salesTax: item.salesTax || 0,
        extraTax: item.extraTax || 0,
        finalValue: item.finalValue || 0
      }))
    };

    console.log('📄 Invoice details fetched for FBR:', invoiceNumber);

    res.json({
      success: true,
      invoice: invoiceData,
      message: 'Invoice details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting invoice by number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice details',
      error: error.message
    });
  }
};

// Create FBR invoice from existing invoice
exports.createFbrInvoiceFromInvoice = async (req, res) => {
  try {
    const { invoiceNumber, sandbox = false } = req.body;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required'
      });
    }

    // Get the original invoice
    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('buyerId')
      .populate('sellerId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if already submitted to FBR
    if (invoice.fbrReference) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already submitted to FBR',
        fbrReference: invoice.fbrReference
      });
    }

    // Validate seller settings
    if (!invoice.sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller details not found for this invoice'
      });
    }

    // Prepare FBR invoice data
    const fbrInvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.buyerId?._id,
      amount: invoice.finalValue || 0,
      items: invoice.items || [],
      buyerNTN: invoice.buyerId?.buyerNTN || '',
      buyerSTRN: invoice.buyerId?.buyerSTRN || '',
      sellerNTN: invoice.sellerId.sellerNTN || '',
      sellerSTRN: invoice.sellerId.sellerSTRN || '',
      totalAmount: invoice.finalValue || 0,
      salesTax: invoice.salesTax || 0,
      extraTax: invoice.extraTax || 0,
      fbrEnvironment: sandbox ? 'sandbox' : 'production',
      invoice: invoice._id
    };

    // Create FBR invoice record
    const fbrInvoice = new FbrInvoice(fbrInvoiceData);
    await fbrInvoice.save();

    console.log('✅ FBR invoice record created:', fbrInvoice._id);

    // Initialize FBR API service
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({
        success: false,
        message: 'FBR API not configured'
      });
    }

    // Validate invoice before submission
    const validation = await fbrApiService.validateInvoice(fbrInvoice);
    if (!validation.isValid) {
      // Update FBR invoice with validation errors
      fbrInvoice.fbrErrorMessage = validation.errors.join(', ');
      fbrInvoice.fbrStatus = 'validation_failed';
      await fbrInvoice.save();

      return res.status(400).json({
        success: false,
        message: 'FBR validation failed',
        errors: validation.errors
      });
    }

    // Submit to FBR
    const submission = await fbrApiService.submitInvoice(fbrInvoice);

    if (submission.success) {
      // Update FBR invoice with success response
      fbrInvoice.fbrReference = submission.fbrReference;
      fbrInvoice.fbrSubmissionResponse = submission.fbrResponse;
      fbrInvoice.fbrSubmissionDate = submission.submissionDate;
      fbrInvoice.fbrStatus = 'submitted';
      fbrInvoice.submittedToFBR = true;
      fbrInvoice.status = 'pending';
      
      await fbrInvoice.save();
      
      // Update original invoice with FBR reference
      invoice.fbrReference = submission.fbrReference;
      invoice.fbrInvoiceId = fbrInvoice._id;
      await invoice.save();
      
      console.log('✅ Invoice submitted to FBR successfully:', submission.fbrReference);

      res.json({
        success: true,
        message: 'FBR invoice created and submitted successfully',
        fbrReference: submission.fbrReference,
        fbrInvoice: fbrInvoice
      });
    } else {
      // Update FBR invoice with error
      fbrInvoice.fbrErrorMessage = submission.error;
      fbrInvoice.fbrStatus = 'rejected';
      fbrInvoice.retryCount = 1;
      fbrInvoice.lastRetryDate = new Date();
      
      await fbrInvoice.save();
      
      res.status(500).json({
        success: false,
        message: 'FBR submission failed',
        error: submission.error
      });
    }

  } catch (error) {
    console.error('❌ Error creating FBR invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FBR invoice',
      error: error.message
    });
  }
};

// Get FBR invoice submissions
exports.getFbrSubmissions = async (req, res) => {
  try {
    const submissions = await FbrInvoice.find()
      .populate('invoice')
      .populate('client')
      .sort({ createdAt: -1 });

    console.log('📋 FBR submissions retrieved:', submissions.length);

    res.json({
      success: true,
      submissions: submissions,
      count: submissions.length,
      message: 'FBR submissions retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting FBR submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FBR submissions',
      error: error.message
    });
  }
};

// Get pending invoices (not yet submitted to FBR)
exports.getPendingInvoices = async (req, res) => {
  try {
    const pendingInvoices = await Invoice.find({ 
      fbrReference: { $exists: false } 
    })
    .populate('buyerId', 'companyName buyerNTN buyerSTRN')
    .populate('sellerId', 'companyName sellerNTN sellerSTRN')
    .sort({ issuedDate: -1 });

    console.log('📋 Pending invoices for FBR:', pendingInvoices.length);

    res.json({
      success: true,
      pendingInvoices: pendingInvoices,
      count: pendingInvoices.length,
      message: 'Pending invoices retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting pending invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending invoices',
      error: error.message
    });
  }
};

// Get FBR invoice by ID
exports.getFbrInvoiceById = async (req, res) => {
  try {
    const fbrInvoice = await FbrInvoice.findById(req.params.id)
      .populate('invoice')
      .populate('client');

    if (!fbrInvoice) {
      return res.status(404).json({
        success: false,
        message: 'FBR invoice not found'
      });
    }

    res.json({
      success: true,
      fbrInvoice: fbrInvoice,
      message: 'FBR invoice retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting FBR invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FBR invoice',
      error: error.message
    });
  }
};

// Retry FBR submission
exports.retryFbrSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    
    const fbrInvoice = await FbrInvoice.findById(id);
    if (!fbrInvoice) {
      return res.status(404).json({
        success: false,
        message: 'FBR invoice not found'
      });
    }

    // Initialize FBR API service
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({
        success: false,
        message: 'FBR API not configured'
      });
    }

    // Submit to FBR
    const submission = await fbrApiService.submitInvoice(fbrInvoice);

    if (submission.success) {
      // Update FBR invoice with success response
      fbrInvoice.fbrReference = submission.fbrReference;
      fbrInvoice.fbrSubmissionResponse = submission.fbrResponse;
      fbrInvoice.fbrSubmissionDate = submission.submissionDate;
      fbrInvoice.fbrStatus = 'submitted';
      fbrInvoice.submittedToFBR = true;
      fbrInvoice.status = 'pending';
      fbrInvoice.retryCount = (fbrInvoice.retryCount || 0) + 1;
      fbrInvoice.lastRetryDate = new Date();
      
      await fbrInvoice.save();
      
      console.log('✅ FBR submission retry successful:', submission.fbrReference);

      res.json({
        success: true,
        message: 'FBR submission retry successful',
        fbrReference: submission.fbrReference
      });
    } else {
      // Update FBR invoice with error
      fbrInvoice.fbrErrorMessage = submission.error;
      fbrInvoice.fbrStatus = 'rejected';
      fbrInvoice.retryCount = (fbrInvoice.retryCount || 0) + 1;
      fbrInvoice.lastRetryDate = new Date();
      
      await fbrInvoice.save();
      
      res.status(500).json({
        success: false,
        message: 'FBR submission retry failed',
        error: submission.error
      });
    }

  } catch (error) {
    console.error('❌ Error retrying FBR submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry FBR submission',
      error: error.message
    });
  }
};
