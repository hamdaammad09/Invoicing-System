const Invoice = require('../models/invoice');
const { exportToExcel } = require('../utils/excel');
const QRCode = require('qrcode');

// Create Invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      buyerInfo,
      sellerInfo,
      items,
      discount,
      gst,
      incomeTax,
      digitalSignature,
      irn
    } = req.body;

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const finalAmount = totalAmount + gst + incomeTax - discount;

    // Generate QR code data (customize as needed)
    const qrData = JSON.stringify({
      invoiceNumber,
      buyerInfo,
      sellerInfo,
      totalAmount,
      finalAmount,
      irn
    });

    // Generate QR code as a Data URL
    const qrCode = await QRCode.toDataURL(qrData);

    const invoice = new Invoice({
      invoiceNumber,
      buyerInfo,
      sellerInfo,
      items,
      totalAmount,
      discount,
      gst,
      incomeTax,
      finalAmount,
      digitalSignature,
      irn,
      qrCode // Save the generated QR code
    });

    await invoice.save();

    const invoiceData = [
      {
        'Invoice Number': invoice.invoiceNumber,
        'Buyer Name': invoice.buyerInfo.name,
        'Seller Name': invoice.sellerInfo.name,
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

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('buyerInfo').populate('sellerInfo');
    res.json(invoices);
  } catch (error) {
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

