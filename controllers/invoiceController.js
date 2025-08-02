const Invoice = require('../models/invoice');
const Client = require('../models/client');
const SellerSettings = require('../models/sellerSettings');
const QRCode = require('qrcode');
const { findHSCode } = require('../utils/hsCodeDatabase');
const { buildSellerQuery, validateSellerOwnership } = require('../middleware/multiTenancyMiddleware');

// Get all invoices (filtered by seller)
exports.getInvoices = async (req, res) => {
  try {
    console.log('📋 Fetching invoices with seller isolation:', {
      sellerId: req.sellerId,
      userRole: req.userRole
    });

    // Build seller-specific query
    const query = buildSellerQuery(req);
    
    const invoices = await Invoice.find(query)
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone')
      .populate('createdBy', 'name email')
      .sort({ issuedDate: -1 });
    
    console.log(`✅ Found ${invoices.length} invoices for seller`);
    
    res.json({
      success: true,
      invoices: invoices,
      count: invoices.length
    });
  } catch (error) {
    console.error('❌ Error fetching invoices:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch invoices' 
    });
  }
};

// Get available buyers for dropdown (filtered by seller)
exports.getAvailableBuyers = async (req, res) => {
  try {
    console.log('📋 Fetching available buyers with seller isolation');

    // Build seller-specific query for active buyers
    const query = buildSellerQuery(req, { status: 'active' });
    
    const buyers = await Client.find(query, 'companyName buyerSTRN buyerNTN truckNo address phone')
      .sort({ companyName: 1 });
    
    console.log(`✅ Found ${buyers.length} available buyers for seller`);
    
    res.json({
      success: true,
      buyers: buyers,
      count: buyers.length
    });
  } catch (error) {
    console.error('❌ Error fetching buyers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch buyers' 
    });
  }
};

// Get available sellers for dropdown (only for admin or current seller)
exports.getAvailableSellers = async (req, res) => {
  try {
    console.log('📋 Fetching available sellers with seller isolation');

    let sellers;
    
    // Admin can see all sellers
    if (req.canAccessAllData) {
      sellers = await SellerSettings.find({}, 'companyName sellerNTN sellerSTRN address phone')
        .sort({ companyName: 1 });
    } else {
      // Sellers can only see their own settings
      sellers = await SellerSettings.find({ _id: req.sellerId }, 'companyName sellerNTN sellerSTRN address phone');
    }
    
    console.log(`✅ Found ${sellers.length} available sellers`);
    
    res.json({
      success: true,
      sellers: sellers,
      count: sellers.length
    });
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sellers' 
    });
  }
};

// Create new invoice (with seller isolation)
exports.createInvoice = async (req, res) => {
  try {
    const { 
      buyerId, 
      items, 
      invoiceNumber,
      status,
      issuedDate,
      // New form fields
      product,
      units,
      unitPrice,
      totalValue,
      salesTax,
      extraTax,
      finalValue
    } = req.body;

    console.log('🔄 Creating invoice with seller isolation:', {
      sellerId: req.sellerId,
      buyerId,
      items,
      product,
      units,
      unitPrice,
      totalValue,
      salesTax,
      extraTax,
      finalValue,
      issuedDate
    });

    // Ensure seller context
    if (!req.sellerId && !req.canAccessAllData) {
      return res.status(403).json({
        success: false,
        error: 'Seller context required to create invoices.'
      });
    }

    // Validate that buyerId is provided
    if (!buyerId) {
      return res.status(400).json({ 
        success: false,
        error: 'buyerId is required. Please select a buyer from the dropdown.' 
      });
    }

    // Validate buyer exists and belongs to this seller
    const buyerQuery = buildSellerQuery(req, { _id: buyerId });
    const buyer = await Client.findOne(buyerQuery);
    
    if (!buyer) {
      return res.status(400).json({ 
        success: false,
        error: 'Selected buyer not found or access denied. Please refresh the page and select a valid buyer.' 
      });
    }

    // Use seller's own settings
    const sellerId = req.sellerId;

    // Process items and assign HS codes
    let processedItems = [];
    
    if (items && items.length > 0) {
      processedItems = await Promise.all(items.map(async (item) => {
        // Auto-assign HS code if not provided
        if (!item.hsCode || item.hsCode === '0000.00.00') {
          const hsCode = await findHSCode(item.description || item.product);
          item.hsCode = hsCode;
        }
        
        return {
          product: item.description || item.product || 'Product Description',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalValue: item.totalValue || (item.quantity * item.unitPrice) || 0,
          salesTax: item.salesTax || 0,
          extraTax: item.extraTax || 0,
          finalValue: item.finalValue || 0,
          hsCode: item.hsCode || '0000.00.00',
          description: item.description || item.product || 'Item Description'
        };
      }));
    } else if (product) {
      // Handle legacy single product format
      const hsCode = await findHSCode(product);
      processedItems = [{
        product: product,
        quantity: units || 1,
        unitPrice: unitPrice || 0,
        totalValue: totalValue || 0,
        salesTax: salesTax || 0,
        extraTax: extraTax || 0,
        finalValue: finalValue || 0,
        hsCode: hsCode,
        description: product
      }];
    }

    // Calculate totals
    const totalAmount = processedItems.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalTax = processedItems.reduce((sum, item) => sum + (item.salesTax || 0), 0);
    const totalExtraTax = processedItems.reduce((sum, item) => sum + (item.extraTax || 0), 0);
    const finalAmount = totalAmount + totalTax + totalExtraTax;

    // Create invoice data
    const invoiceData = {
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      buyerId: buyerId,
      sellerId: sellerId,
      items: processedItems,
      totalAmount: totalAmount,
      salesTax: totalTax,
      extraTax: totalExtraTax,
      finalValue: finalAmount,
      status: status || 'pending',
      issuedDate: issuedDate || new Date(),
      createdBy: req.user._id
    };

    console.log('📝 Invoice data prepared:', invoiceData);

    const invoice = new Invoice(invoiceData);
    const savedInvoice = await invoice.save();

    console.log('✅ Invoice created successfully:', savedInvoice._id);

    res.status(201).json({
      success: true,
      invoice: savedInvoice,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create invoice. Please try again.' 
    });
  }
};

// Generate PDF for specific invoice
exports.generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    console.log('🔍 Generating PDF for invoice ID:', invoiceId);
    
    // Get invoice with populated buyer and seller data
    const invoice = await Invoice.findById(invoiceId)
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address phone')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');
    
    if (!invoice) {
      console.log('❌ Invoice not found for ID:', invoiceId);
      return res.status(404).json({ error: 'Invoice not found' });
    }

    console.log('📄 Invoice found:', {
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      hasBuyerId: !!invoice.buyerId,
      hasSellerId: !!invoice.sellerId
    });

    // Extract buyer and seller data
    const buyer = invoice.buyerId;
    const seller = invoice.sellerId;

    if (!buyer || !seller) {
      console.log('❌ Missing buyer or seller data:', {
        hasBuyer: !!buyer,
        hasSeller: !!seller,
        buyerId: invoice.buyerId,
        sellerId: invoice.sellerId
      });
      
      return res.status(400).json({ 
        error: 'Buyer or Seller data not found. This invoice may not have proper buyer/seller associations.',
        invoiceId: invoice._id,
        hasBuyer: !!buyer,
        hasSeller: !!seller,
        buyerId: invoice.buyerId,
        sellerId: invoice.sellerId
      });
    }

    console.log('✅ Buyer data:', {
      companyName: buyer.companyName,
      buyerSTRN: buyer.buyerSTRN,
      buyerNTN: buyer.buyerNTN
    });

    console.log('✅ Seller data:', {
      companyName: seller.companyName,
      sellerNTN: seller.sellerNTN,
      sellerSTRN: seller.sellerSTRN
    });

    // Return data for PDF generation
    const pdfData = {
      invoice,
      buyer: {
        companyName: buyer.companyName,
        buyerSTRN: buyer.buyerSTRN,
        buyerNTN: buyer.buyerNTN,
        truckNo: buyer.truckNo,
        address: buyer.address,
        phone: buyer.phone
      },
      seller: {
        companyName: seller.companyName,
        sellerNTN: seller.sellerNTN,
        sellerSTRN: seller.sellerSTRN,
        address: seller.address,
        phone: seller.phone
      }
    };

    console.log('📤 Sending PDF data for invoice:', invoice.invoiceNumber);
    res.json(pdfData);

  } catch (error) {
    console.error('❌ Error generating PDF data:', error);
    res.status(500).json({ error: 'Failed to generate PDF data' });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// Migration function to fix existing invoices without proper buyer/seller IDs
exports.migrateInvoices = async (req, res) => {
  try {
    // Get first available buyer and seller as defaults
    const defaultBuyer = await Client.findOne();
    const defaultSeller = await SellerSettings.findOne();
    
    if (!defaultBuyer || !defaultSeller) {
      return res.status(400).json({ 
        error: 'Cannot migrate: No default buyer or seller found. Please create at least one buyer and seller first.' 
      });
    }

    // Find invoices without proper buyerId or sellerId
    const invoicesToMigrate = await Invoice.find({
      $or: [
        { buyerId: { $exists: false } },
        { sellerId: { $exists: false } },
        { buyerId: null },
        { sellerId: null }
      ]
    });

    if (invoicesToMigrate.length === 0) {
      return res.json({ message: 'No invoices need migration. All invoices already have proper buyer/seller associations.' });
    }

    // Update each invoice
    const updatePromises = invoicesToMigrate.map(invoice => {
      return Invoice.findByIdAndUpdate(invoice._id, {
        buyerId: invoice.buyerId || defaultBuyer._id,
        sellerId: invoice.sellerId || defaultSeller._id
      }, { new: true });
    });

    const updatedInvoices = await Promise.all(updatePromises);

    res.json({ 
      message: `Successfully migrated ${updatedInvoices.length} invoices`,
      migratedCount: updatedInvoices.length,
      defaultBuyer: defaultBuyer.companyName,
      defaultSeller: defaultSeller.companyName
    });

  } catch (error) {
    console.error('Error migrating invoices:', error);
    res.status(500).json({ error: 'Failed to migrate invoices' });
  }
};

// Debug endpoint to check invoice associations
exports.debugInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address phone')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone')
      .sort({ createdAt: -1 });

    const debugData = invoices.map(invoice => ({
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      hasBuyerId: !!invoice.buyerId,
      hasSellerId: !!invoice.sellerId,
      buyerData: invoice.buyerId ? {
        companyName: invoice.buyerId.companyName,
        buyerSTRN: invoice.buyerId.buyerSTRN,
        buyerNTN: invoice.buyerId.buyerNTN
      } : null,
      sellerData: invoice.sellerId ? {
        companyName: invoice.sellerId.companyName,
        sellerNTN: invoice.sellerId.sellerNTN,
        sellerSTRN: invoice.sellerId.sellerSTRN
      } : null,
      createdAt: invoice.createdAt
    }));

    res.json({
      totalInvoices: invoices.length,
      invoices: debugData
    });

  } catch (error) {
    console.error('Error debugging invoices:', error);
    res.status(500).json({ error: 'Failed to debug invoices' });
  }
};

// Get invoice details with buyer/seller selection for PDF
exports.getInvoiceForPDF = async (req, res) => {
  try {
    const { invoiceId, selectedBuyerId, selectedSellerId } = req.params;
    
    console.log('🔍 Getting invoice for PDF:', {
      invoiceId,
      selectedBuyerId,
      selectedSellerId
    });

    // Get the invoice
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get buyer data (use selected buyer or invoice's buyer)
    let buyer;
    if (selectedBuyerId && selectedBuyerId !== 'default') {
      buyer = await Client.findById(selectedBuyerId);
      console.log('✅ Using selected buyer:', buyer?.companyName);
    } else {
      buyer = await Client.findById(invoice.buyerId);
      console.log('✅ Using invoice default buyer:', buyer?.companyName);
    }

    // Get seller data (use selected seller or invoice's seller)
    let seller;
    if (selectedSellerId && selectedSellerId !== 'default') {
      seller = await SellerSettings.findById(selectedSellerId);
      console.log('✅ Using selected seller:', seller?.companyName);
    } else {
      seller = await SellerSettings.findById(invoice.sellerId);
      console.log('✅ Using invoice default seller:', seller?.companyName);
    }

    if (!buyer || !seller) {
      return res.status(400).json({ 
        error: 'Buyer or Seller data not found. Please ensure valid buyer and seller are selected.',
        hasBuyer: !!buyer,
        hasSeller: !!seller
      });
    }

    // Return data for PDF generation
    const pdfData = {
      invoice,
      buyer: {
        companyName: buyer.companyName,
        buyerSTRN: buyer.buyerSTRN,
        buyerNTN: buyer.buyerNTN,
        truckNo: buyer.truckNo,
        address: buyer.address,
        phone: buyer.phone
      },
      seller: {
        companyName: seller.companyName,
        sellerNTN: seller.sellerNTN,
        sellerSTRN: seller.sellerSTRN,
        address: seller.address,
        phone: seller.phone
      },
      selectedBuyerId: selectedBuyerId,
      selectedSellerId: selectedSellerId
    };

    console.log('📤 Sending PDF data with selected buyer/seller');
    res.json(pdfData);

  } catch (error) {
    console.error('❌ Error getting invoice for PDF:', error);
    res.status(500).json({ error: 'Failed to get invoice data for PDF' });
  }
};

