const Invoice = require('../models/invoice');
const { exportToExcel } = require('../utils/excel');
const QRCode = require('qrcode');

// Create Invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      buyerInfo,
      items,
      totalAmount,
      discount,
      gst,
      incomeTax,
      finalAmount,
      digitalSignature,
      irn,
      qrCode
    } = req.body;

    // Handle items - if it's a string, convert to array format
    let processedItems = [];
    if (typeof items === 'string' && items.trim()) {
      // Split by comma and create item objects
      processedItems = items.split(',').map(item => ({
        name: item.trim(),
        price: parseFloat(totalAmount) || 0,
        quantity: 1
      }));
    } else if (Array.isArray(items)) {
      processedItems = items;
    }

    // Calculate amounts if not provided
    const calculatedTotalAmount = totalAmount || processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const calculatedFinalAmount = finalAmount || (calculatedTotalAmount + (parseFloat(gst) || 0) + (parseFloat(incomeTax) || 0) - (parseFloat(discount) || 0));

    // Generate QR code if not provided
    let generatedQRCode = qrCode;
    if (!qrCode) {
      try {
        const qrData = JSON.stringify({
          invoiceNumber,
          buyerInfo,
          totalAmount: calculatedTotalAmount,
          finalAmount: calculatedFinalAmount,
          irn
        });
        generatedQRCode = await QRCode.toDataURL(qrData);
      } catch (qrError) {
        console.log('QR code generation failed, using null:', qrError.message);
        generatedQRCode = null;
      }
    }

    const invoice = new Invoice({
      invoiceNumber,
      buyerInfo: buyerInfo || null, // Handle as string for now
      sellerInfo: null, // Will be set later if needed
      items: processedItems,
      totalAmount: calculatedTotalAmount,
      discount: parseFloat(discount) || 0,
      gst: parseFloat(gst) || 0,
      incomeTax: parseFloat(incomeTax) || 0,
      finalAmount: calculatedFinalAmount,
      digitalSignature,
      irn,
      qrCode: generatedQRCode
    });

    await invoice.save();

    // Export to Excel (optional - can be commented out if causing issues)
    try {
      const invoiceData = [
        {
          'Invoice Number': invoice.invoiceNumber,
          'Buyer Info': invoice.buyerInfo,
          'Total Amount': invoice.totalAmount,
          'Discount': invoice.discount,
          'GST': invoice.gst,
          'Income Tax': invoice.incomeTax,
          'Final Amount': invoice.finalAmount,
          'Issued Date': invoice.issuedDate,
          'Status': invoice.status,
        },
      ];
      exportToExcel(invoiceData, `invoice_${invoice.invoiceNumber}`);
    } catch (exportError) {
      console.log('Excel export failed:', exportError.message);
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get All Invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get Single Invoice
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('buyerInfo').populate('sellerInfo');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔄 Update Invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { items, discount, gst, incomeTax, status } = req.body;

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const finalAmount = totalAmount + gst + incomeTax - discount;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        items,
        discount,
        gst,
        incomeTax,
        totalAmount,
        finalAmount,
        status,
      },
      { new: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

