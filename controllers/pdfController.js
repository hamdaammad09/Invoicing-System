const PDFDocument = require('pdfkit');
const fs = require('fs');

// Generate PDF for a single invoice
const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Get invoice data from database
    const Invoice = require('../models/invoice');
    const Client = require('../models/client');
    const SellerSettings = require('../models/sellerSettings');
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get seller settings (default if not exists)
    let sellerSettings = await SellerSettings.findOne();
    if (!sellerSettings) {
      sellerSettings = new SellerSettings();
    }

    // Get buyer/client information
    let buyerInfo = null;
    if (invoice.buyerInfo && typeof invoice.buyerInfo === 'string') {
      buyerInfo = await Client.findById(invoice.buyerInfo);
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber || invoiceId}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // ===== SELLER INFORMATION (Top Section) =====
    // Company logo placeholder (you can add actual logo later)
    doc.fontSize(20).font('Helvetica-Bold').text(sellerSettings.companyName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(sellerSettings.address, { align: 'center' });
    if (sellerSettings.phone) {
      doc.fontSize(10).font('Helvetica').text(`Tel: ${sellerSettings.phone}`, { align: 'center' });
    }
    doc.moveDown(1);

    // Draw line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Add invoice title
    doc.fontSize(16).font('Helvetica-Bold').text('SALES TAX INVOICE', { align: 'center' });
    doc.moveDown(1);

    // Seller details (left and right columns)
    const leftX = 50;
    const rightX = 300;
    let currentY = doc.y;

    // Left column - Seller NTN and Invoice No
    doc.fontSize(10).font('Helvetica-Bold').text('NTN:', leftX, currentY);
    doc.fontSize(10).font('Helvetica').text(sellerSettings.sellerNTN, leftX + 40, currentY);
    
    doc.fontSize(10).font('Helvetica-Bold').text('Invoice No:', leftX, currentY + 20);
    doc.fontSize(10).font('Helvetica').text(sellerSettings.invoiceNumber || invoice.invoiceNumber || 'N/A', leftX + 70, currentY + 20);

    // Right column - Seller STRN and Date
    doc.fontSize(10).font('Helvetica-Bold').text('STRN:', rightX, currentY);
    doc.fontSize(10).font('Helvetica').text(sellerSettings.sellerSTRN, rightX + 40, currentY);
    
    doc.fontSize(10).font('Helvetica-Bold').text('Date:', rightX, currentY + 20);
    doc.fontSize(10).font('Helvetica').text(invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A', rightX + 40, currentY + 20);

    doc.moveDown(3);

    // ===== BUYER INFORMATION (Middle Section) =====
    doc.fontSize(12).font('Helvetica-Bold').text('Messers:', leftX, doc.y);
    doc.fontSize(11).font('Helvetica').text(buyerInfo ? buyerInfo.company || buyerInfo.name : 'N/A', leftX + 60, doc.y);
    doc.moveDown(0.5);

    if (buyerInfo && buyerInfo.address) {
      doc.fontSize(10).font('Helvetica').text(buyerInfo.address, leftX, doc.y);
      doc.moveDown(0.5);
    }

    // Buyer details in two columns
    const buyerLeftX = leftX;
    const buyerRightX = rightX;
    currentY = doc.y;

    // Left column - Buyer STRN and Truck No
    doc.fontSize(10).font('Helvetica-Bold').text('Buyers STRN:', buyerLeftX, currentY);
    doc.fontSize(10).font('Helvetica').text(buyerInfo ? buyerInfo.buyerSTRN || 'N/A' : 'N/A', buyerLeftX + 80, currentY);
    
    doc.fontSize(10).font('Helvetica-Bold').text('Truck No:', buyerLeftX, currentY + 20);
    doc.fontSize(10).font('Helvetica').text(buyerInfo ? buyerInfo.truckNo || 'N/A' : 'N/A', buyerLeftX + 60, currentY + 20);

    // Right column - Buyer NTN
    doc.fontSize(10).font('Helvetica-Bold').text('Buyers NTN:', buyerRightX, currentY);
    doc.fontSize(10).font('Helvetica').text(buyerInfo ? buyerInfo.buyerNTN || 'N/A' : 'N/A', buyerRightX + 80, currentY);

    doc.moveDown(3);

    // ===== INVOICE ITEMS TABLE =====
    const tableTop = doc.y + 10;
    
    // Table headers
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Product', 50, tableTop);
    doc.text('Units/Quantity', 150, tableTop);
    doc.text('Unit Price', 220, tableTop);
    doc.text('Total Value', 290, tableTop);
    doc.text('Sales Tax', 360, tableTop);
    doc.text('Extra Tax', 430, tableTop);
    doc.text('Value including', 500, tableTop);
    doc.text('GST & Extra Tax', 500, tableTop + 12);

    // Draw table header lines
    doc.moveTo(50, tableTop - 5).lineTo(550, tableTop - 5).stroke();
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    // Add items
    let currentTableY = tableTop + 25;
    doc.fontSize(9).font('Helvetica');
    
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item, index) => {
        const product = item.product || 'Service';
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || 0;
        const totalValue = item.totalValue || (quantity * unitPrice);
        const salesTax = item.salesTax || (totalValue * 0.18);
        const extraTax = item.extraTax || 0;
        const finalValue = item.finalValue || (totalValue + salesTax + extraTax);

        doc.text(product, 50, currentTableY);
        doc.text(quantity.toString(), 150, currentTableY);
        doc.text(`₹${unitPrice.toFixed(2)}`, 220, currentTableY);
        doc.text(`₹${totalValue.toFixed(2)}`, 290, currentTableY);
        doc.text(`₹${salesTax.toFixed(2)}`, 360, currentTableY);
        doc.text(extraTax > 0 ? `₹${extraTax.toFixed(2)}` : '-', 430, currentTableY);
        doc.text(`₹${finalValue.toFixed(2)}`, 500, currentTableY);
        
        currentTableY += 20;
      });
    } else {
      // Fallback for string items
      const product = invoice.items || 'Consultancy Service';
      const quantity = 1;
      const totalValue = parseFloat(invoice.totalAmount) || 0;
      const salesTax = totalValue * 0.18;
      const finalValue = totalValue + salesTax;

      doc.text(product, 50, currentTableY);
      doc.text(quantity.toString(), 150, currentTableY);
      doc.text(`₹${totalValue.toFixed(2)}`, 220, currentTableY);
      doc.text(`₹${totalValue.toFixed(2)}`, 290, currentTableY);
      doc.text(`₹${salesTax.toFixed(2)}`, 360, currentTableY);
      doc.text('-', 430, currentTableY);
      doc.text(`₹${finalValue.toFixed(2)}`, 500, currentTableY);
    }

    // Draw bottom line
    doc.moveTo(50, currentTableY + 5).lineTo(550, currentTableY + 5).stroke();

    // ===== NOTES SECTION =====
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Note:-', leftX, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').text('1 Item Supplied for local use (as per undertaking) for export', leftX + 10, doc.y);

    // ===== SIGNATURE SECTION =====
    doc.moveDown(4);
    const signatureY = doc.y;
    
    // Left signature
    doc.fontSize(10).font('Helvetica-Bold').text('PREPARED BY', leftX, signatureY);
    doc.moveTo(leftX, signatureY + 15).lineTo(leftX + 100, signatureY + 15).stroke();
    
    // Right signature
    doc.fontSize(10).font('Helvetica-Bold').text('Authorized Signatory', rightX, signatureY);
    doc.moveTo(rightX, signatureY + 15).lineTo(rightX + 120, signatureY + 15).stroke();

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Generate PDF for multiple invoices
const generateMultipleInvoicesPDF = async (req, res) => {
  try {
    const { invoiceIds } = req.body;
    
    if (!invoiceIds || !Array.isArray(invoiceIds)) {
      return res.status(400).json({ error: 'Invoice IDs array is required' });
    }

    // Get invoices from database
    const Invoice = require('../models/invoice');
    const invoices = await Invoice.find({ _id: { $in: invoiceIds } });
    
    if (invoices.length === 0) {
      return res.status(404).json({ error: 'No invoices found' });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoices-${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(16).font('Helvetica-Bold').text('INVOICES REPORT', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Generate each invoice
    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      
      // Add page break if not first invoice
      if (i > 0) {
        doc.addPage();
      }

      // Add invoice header
      doc.fontSize(14).font('Helvetica-Bold').text(`Invoice #${invoice.invoiceNumber || invoice._id.slice(-6)}`, { align: 'center' });
      doc.moveDown(1);

      // Add invoice details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Date: ${invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}`);
      doc.text(`Client: ${invoice.buyerInfo || 'N/A'}`);
      doc.text(`Items: ${invoice.items || 'N/A'}`);
      doc.text(`Total Amount: ₹${(parseFloat(invoice.totalAmount) || 0).toFixed(2)}`);
      doc.text(`Final Amount: ₹${(parseFloat(invoice.finalAmount) || 0).toFixed(2)}`);
      doc.text(`Status: ${invoice.status || 'pending'}`);
      
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating multiple invoices PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = {
  generateInvoicePDF,
  generateMultipleInvoicesPDF
};
