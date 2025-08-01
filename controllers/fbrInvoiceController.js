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

    console.log('📄 Creating FBR invoice from invoice:', invoiceNumber);

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

    // Validate buyer information (required by FBR)
    if (!invoice.buyerId) {
      return res.status(400).json({
        success: false,
        message: 'Buyer information not found for this invoice'
      });
    }

    // Validate items exist and have descriptions
    if (!invoice.items || invoice.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must have at least one item'
      });
    }

    // Note: We'll provide default descriptions for items that don't have them
    console.log('✅ Invoice found and validated');

    // Debug: Log invoice items structure
    console.log('📋 Original invoice items:', JSON.stringify(invoice.items, null, 2));

    // Prepare FBR invoice data (only buyer info and invoice details)
    const fbrInvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      
      // Buyer information (required by FBR)
      buyerName: invoice.buyerId.companyName,
      buyerNTN: invoice.buyerId.buyerNTN || '',
      buyerSTRN: invoice.buyerId.buyerSTRN || '',
      buyerAddress: invoice.buyerId.address || '',
      buyerPhone: invoice.buyerId.phone || '',
      buyerEmail: invoice.buyerId.email || '',
      
      // Invoice details
      totalAmount: invoice.finalValue || 0,
      salesTax: invoice.salesTax || 0,
      extraTax: invoice.extraTax || 0,
      discount: invoice.discount || 0,
      finalAmount: invoice.finalValue || 0,
      
      // Items array - properly map with required fields
      items: (invoice.items || []).map((item, index) => {
        // Ensure we have a valid description
        let description = item.description || item.product || item.name || item.itemName;
        if (!description || description.trim() === '') {
          description = `Item ${index + 1}`;
        }
        
        console.log(`📦 Mapping item ${index + 1}:`, {
          original: item,
          mappedDescription: description
        });
        
        return {
          description: description,
          hsCode: item.hsCode || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalValue: item.totalValue || item.amount || (item.quantity * item.unitPrice) || 0,
          salesTax: item.salesTax || 0,
          discount: item.discount || 0
        };
      }),
      
      // FBR environment
      fbrEnvironment: sandbox ? 'sandbox' : 'production',
      
      // Linked data
      originalInvoice: invoice._id,
      buyer: invoice.buyerId._id,
      
      // Invoice dates
      invoiceDate: invoice.issuedDate,
      dueDate: invoice.dueDate
    };

    console.log('📝 FBR invoice data prepared');

    // Debug: Log mapped FBR items
    console.log('📋 Mapped FBR items:', JSON.stringify(fbrInvoiceData.items, null, 2));

    // Create FBR invoice record
    const fbrInvoice = new FbrInvoice(fbrInvoiceData);
    await fbrInvoice.save();

    console.log('✅ FBR invoice record created:', fbrInvoice._id);

    // Initialize FBR API service
    const initialized = await fbrApiService.initialize();
    if (!initialized) {
      return res.status(500).json({
        success: false,
        message: 'FBR API not configured or seller not authenticated'
      });
    }

    // Validate invoice before submission
    const validation = await fbrApiService.validateInvoice(fbrInvoiceData);
    if (!validation.isValid) {
      // Update FBR invoice with validation errors
      fbrInvoice.fbrErrorMessage = validation.errors.join(', ');
      fbrInvoice.status = 'rejected';
      await fbrInvoice.save();

      return res.status(400).json({
        success: false,
        message: 'FBR validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    console.log('✅ Invoice validation passed');

    // Submit to FBR
    const submission = await fbrApiService.submitInvoice(fbrInvoiceData);

    if (submission.success) {
      // Update FBR invoice with success response
      fbrInvoice.uuid = submission.uuid;
      fbrInvoice.irn = submission.irn;
      fbrInvoice.qrCode = submission.qrCode;
      fbrInvoice.fbrReference = submission.fbrReference;
      fbrInvoice.fbrSubmissionResponse = submission.fbrResponse;
      fbrInvoice.fbrSubmissionDate = new Date();
      fbrInvoice.status = 'submitted';
      
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
        uuid: submission.uuid,
        irn: submission.irn,
        qrCode: submission.qrCode,
        fbrInvoice: fbrInvoice
      });
    } else {
      // Update FBR invoice with error
      fbrInvoice.fbrErrorMessage = submission.error;
      fbrInvoice.status = 'rejected';
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
    console.log('🔍 Fetching FBR submissions...');
    
    const submissions = await FbrInvoice.find()
      .populate({
        path: 'invoice',
        populate: [
          { path: 'buyerId', select: 'companyName buyerNTN buyerSTRN' },
          { path: 'sellerId', select: 'companyName sellerNTN sellerSTRN' }
        ]
      })
      .populate('client')
      .sort({ createdAt: -1 });

    console.log('📋 FBR submissions retrieved:', submissions.length);

    // Transform the data to include proper buyer/seller names
    const transformedSubmissions = submissions.map(submission => {
      const invoice = submission.invoice;
      
      // Get buyer and seller names from the linked invoice
      const buyerName = invoice?.buyerId?.companyName || 'Unknown Buyer';
      const sellerName = invoice?.sellerId?.companyName || 'Unknown Seller';
      
      // For tax consultancy: seller = client, buyer = customer
      const clientName = sellerName;
      const customerName = buyerName;

      return {
        ...submission.toObject(),
        // Add computed fields for display
        buyerName: buyerName,
        sellerName: sellerName,
        clientName: clientName,
        customerName: customerName,
        // Add buyer/seller details
        buyerNTN: invoice?.buyerId?.buyerNTN || '',
        buyerSTRN: invoice?.buyerId?.buyerSTRN || '',
        sellerNTN: invoice?.sellerId?.sellerNTN || '',
        sellerSTRN: invoice?.sellerId?.sellerSTRN || '',
        // Add invoice details
        invoiceNumber: invoice?.invoiceNumber || submission.invoiceNumber,
        totalAmount: invoice?.finalValue || submission.amount,
        issuedDate: invoice?.issuedDate || submission.createdAt
      };
    });

    console.log('✅ FBR submissions transformed with buyer/seller data');

    res.json({
      success: true,
      submissions: transformedSubmissions,
      count: transformedSubmissions.length,
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

// Fix existing FBR submissions with missing invoice links
exports.fixFbrSubmissions = async (req, res) => {
  try {
    console.log('🔧 Fixing FBR submissions with missing invoice links...');
    
    // Find FBR submissions that don't have invoice links
    const submissionsWithoutInvoice = await FbrInvoice.find({
      $or: [
        { invoice: { $exists: false } },
        { invoice: null }
      ]
    });

    console.log(`📋 Found ${submissionsWithoutInvoice.length} submissions without invoice links`);

    let fixedCount = 0;
    const results = [];

    for (const submission of submissionsWithoutInvoice) {
      try {
        // Try to find the original invoice by invoice number
        const invoice = await Invoice.findOne({ 
          invoiceNumber: submission.invoiceNumber 
        });

        if (invoice) {
          // Update the FBR submission with the invoice link
          submission.invoice = invoice._id;
          submission.client = invoice.buyerId; // Link to buyer as client
          await submission.save();
          
          fixedCount++;
          results.push({
            fbrInvoiceId: submission._id,
            invoiceNumber: submission.invoiceNumber,
            status: 'fixed',
            linkedInvoiceId: invoice._id
          });
          
          console.log(`✅ Fixed submission ${submission.invoiceNumber}`);
        } else {
          results.push({
            fbrInvoiceId: submission._id,
            invoiceNumber: submission.invoiceNumber,
            status: 'invoice_not_found',
            error: 'Original invoice not found'
          });
          
          console.log(`❌ Invoice not found for ${submission.invoiceNumber}`);
        }
      } catch (error) {
        console.error(`❌ Error fixing submission ${submission.invoiceNumber}:`, error);
        results.push({
          fbrInvoiceId: submission._id,
          invoiceNumber: submission.invoiceNumber,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Fixed ${fixedCount} out of ${submissionsWithoutInvoice.length} submissions`);

    res.json({
      success: true,
      message: `Fixed ${fixedCount} FBR submissions`,
      totalFound: submissionsWithoutInvoice.length,
      fixedCount: fixedCount,
      results: results
    });

  } catch (error) {
    console.error('❌ Error fixing FBR submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix FBR submissions',
      error: error.message
    });
  }
};

// Get FBR submission statistics
exports.getFbrSubmissionStats = async (req, res) => {
  try {
    console.log('📊 Fetching FBR submission statistics...');
    
    const stats = await FbrInvoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const statsObject = {
      accepted: 0,
      pending: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      statsObject[stat._id] = stat.count;
      statsObject.total += stat.count;
    });

    console.log('✅ FBR submission stats:', statsObject);

    res.json({
      success: true,
      stats: statsObject,
      message: 'FBR submission statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting FBR submission stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FBR submission statistics',
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
