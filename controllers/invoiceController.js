const Invoice = require('../models/invoice');
const Client = require('../models/client');
const SellerSettings = require('../models/sellerSettings');
const QRCode = require('qrcode');

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address') // Populate buyer data
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone') // Populate seller data
      .sort({ issuedDate: -1 });
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get available buyers for dropdown
exports.getAvailableBuyers = async (req, res) => {
  try {
    const buyers = await Client.find({}, 'companyName buyerSTRN buyerNTN truckNo address phone')
      .sort({ companyName: 1 });
    
    console.log(`✅ Found ${buyers.length} available buyers`);
    res.json(buyers);
  } catch (error) {
    console.error('❌ Error fetching buyers:', error);
    res.status(500).json({ error: 'Failed to fetch buyers' });
  }
};

// Get available sellers for dropdown
exports.getAvailableSellers = async (req, res) => {
  try {
    const sellers = await SellerSettings.find({}, 'companyName sellerNTN sellerSTRN address phone')
      .sort({ companyName: 1 });
    
    console.log(`✅ Found ${sellers.length} available sellers`);
    res.json(sellers);
  } catch (error) {
    console.error('❌ Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const { 
      buyerId, 
      sellerId, 
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

    console.log('🔄 Creating invoice with data:', {
      buyerId,
      sellerId,
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

    // Validate that buyerId and sellerId are provided
    if (!buyerId) {
      return res.status(400).json({ error: 'buyerId is required. Please select a buyer from the dropdown.' });
    }
    
    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required. Please select a seller from the dropdown.' });
    }

    // Validate buyer and seller exist
    const buyer = await Client.findById(buyerId);
    const seller = await SellerSettings.findById(sellerId);
    
    if (!buyer) {
      return res.status(400).json({ 
        error: 'Selected buyer not found. Please refresh the page and select a valid buyer.' 
      });
    }
    
    if (!seller) {
      return res.status(400).json({ 
        error: 'Selected seller not found. Please refresh the page and select a valid seller.' 
      });
    }

    console.log('✅ Buyer found:', buyer.companyName);
    console.log('✅ Seller found:', seller.companyName);

    // Generate invoice number if not provided
    const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;

    // Generate QR code with specific invoice data (with prefix to avoid phone number detection)
    const qrData = `TAX_INVOICE:${JSON.stringify({
      invoiceNumber: finalInvoiceNumber,
      buyerNTN: buyer.buyerNTN,
      sellerNTN: seller.sellerNTN,
      date: issuedDate ? new Date(issuedDate).toISOString() : new Date().toISOString()
    })}`;
    
    console.log('🔍 QR Code Data:', qrData);
    
    console.log('🔍 Generating QR code with data:', qrData);
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });

    // Prepare items array - handle both new form fields and legacy items
    let itemsArray = [];
    
    // If we have new form fields, use them
    if (product && (unitPrice || totalValue)) {
      itemsArray = [{
        product: product,
        quantity: parseFloat(units) || 1,
        unitPrice: parseFloat(unitPrice) || 0,
        totalValue: parseFloat(totalValue) || 0,
        salesTax: parseFloat(salesTax) || 0,
        extraTax: parseFloat(extraTax) || 0,
        finalValue: parseFloat(finalValue) || 0
      }];
    } else if (items && Array.isArray(items)) {
      itemsArray = items;
    } else if (items && typeof items === 'string') {
      // Handle case where items is sent as a string
      try {
        itemsArray = JSON.parse(items);
      } catch (e) {
        // If parsing fails, create a single item
        itemsArray = [{
          product: items,
          quantity: 1,
          unitPrice: totalValue || 0,
          totalValue: totalValue || 0,
          salesTax: salesTax || 0,
          extraTax: extraTax || 0,
          finalValue: finalValue || totalValue || 0
        }];
      }
    } else {
      // Default item if no items provided
      itemsArray = [{
        product: 'Tax Filing',
        quantity: 1,
        unitPrice: totalValue || 0,
        totalValue: totalValue || 0,
        salesTax: salesTax || 0,
        extraTax: extraTax || 0,
        finalValue: finalValue || totalValue || 0
      }];
    }

    const invoice = new Invoice({
      invoiceNumber: finalInvoiceNumber,
      buyerId,
      sellerId,
      items: itemsArray,
      qrCode,
      status,
      issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
      // Store new form fields for compatibility
      product,
      units,
      unitPrice,
      totalValue,
      salesTax,
      extraTax,
      finalValue
    });

    const savedInvoice = await invoice.save();
    
    console.log('✅ Invoice saved with ID:', savedInvoice._id);
    
    // Populate the saved invoice with buyer and seller data
    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate('buyerId', 'companyName buyerSTRN buyerNTN truckNo address phone')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');

    console.log('✅ Invoice created successfully with populated data');
    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice. Please try again.' });
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

