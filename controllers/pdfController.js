const PDFDocument = require('pdfkit');
const fs = require('fs');

// Generate PDF for a single invoice
const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Get invoice data from database
    const Invoice = require('../models/invoice');
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
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

    // Add company header
    doc.fontSize(20).font('Helvetica-Bold').text('CONSULTANCY FORUM', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Tax & Accounting Platform', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Professional Tax Consultancy Services', { align: 'center' });
    doc.moveDown(2);

    // Add invoice title
    doc.fontSize(16).font('Helvetica-Bold').text('SALES TAX INVOICE', { align: 'center' });
    doc.moveDown(1);

    // Invoice details section
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Invoice Details:', 50, doc.y);
    doc.moveDown(0.5);
    
    doc.fontSize(9).font('Helvetica');
    doc.text(`Invoice No: ${invoice.invoiceNumber || 'N/A'}`, 60, doc.y);
    doc.text(`Date: ${invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}`, 60, doc.y);
    doc.moveDown(1);

    // Seller information
    doc.fontSize(10).font('Helvetica-Bold').text('Seller Information:', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');
    doc.text('Company: CONSULTANCY FORUM', 60, doc.y);
    doc.text('Address: Professional Tax Services', 60, doc.y);
    doc.text('NTN: [Your NTN Number]', 60, doc.y);
    doc.text('STRN: [Your STRN Number]', 60, doc.y);
    doc.moveDown(1);

    // Buyer information
    doc.fontSize(10).font('Helvetica-Bold').text('Buyer Information:', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');
    doc.text(`Client: ${invoice.buyerInfo || 'N/A'}`, 60, doc.y);
    doc.moveDown(1);

    // Items table header
    const tableTop = doc.y + 10;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Quantity', 200, tableTop);
    doc.text('Unit Price', 280, tableTop);
    doc.text('Total', 350, tableTop);
    doc.text('Tax (18%)', 420, tableTop);
    doc.text('Final Amount', 490, tableTop);

    // Draw table lines
    doc.moveTo(50, tableTop - 5).lineTo(550, tableTop - 5).stroke();
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Add items
    let currentY = tableTop + 20;
    doc.fontSize(9).font('Helvetica');
    
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach((item, index) => {
        const itemName = typeof item === 'string' ? item : (item.name || item.description || 'Service');
        const quantity = item.quantity || 1;
        const unitPrice = item.unitPrice || item.price || 0;
        const total = quantity * unitPrice;
        const tax = total * 0.18; // 18% tax
        const finalAmount = total + tax;

        doc.text(itemName, 50, currentY);
        doc.text(quantity.toString(), 200, currentY);
        doc.text(`₹${unitPrice.toFixed(2)}`, 280, currentY);
        doc.text(`₹${total.toFixed(2)}`, 350, currentY);
        doc.text(`₹${tax.toFixed(2)}`, 420, currentY);
        doc.text(`₹${finalAmount.toFixed(2)}`, 490, currentY);
        
        currentY += 20;
      });
    } else {
      // Fallback for string items
      const itemName = invoice.items || 'Consultancy Service';
      const totalAmount = parseFloat(invoice.totalAmount) || 0;
      const tax = totalAmount * 0.18;
      const finalAmount = totalAmount + tax;

      doc.text(itemName, 50, currentY);
      doc.text('1', 200, currentY);
      doc.text(`₹${totalAmount.toFixed(2)}`, 280, currentY);
      doc.text(`₹${totalAmount.toFixed(2)}`, 350, currentY);
      doc.text(`₹${tax.toFixed(2)}`, 420, currentY);
      doc.text(`₹${finalAmount.toFixed(2)}`, 490, currentY);
    }

    // Draw bottom line
    doc.moveTo(50, currentY + 5).lineTo(550, currentY + 5).stroke();

    // Summary section
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica-Bold').text('Summary:', 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');
    doc.text(`Subtotal: ₹${(parseFloat(invoice.totalAmount) || 0).toFixed(2)}`, 400, doc.y);
    doc.text(`Discount: ₹${(parseFloat(invoice.discount) || 0).toFixed(2)}`, 400, doc.y);
    doc.text(`GST (18%): ₹${(parseFloat(invoice.gst) || 0).toFixed(2)}`, 400, doc.y);
    doc.text(`Income Tax: ₹${(parseFloat(invoice.incomeTax) || 0).toFixed(2)}`, 400, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Final Amount: ₹${(parseFloat(invoice.finalAmount) || 0).toFixed(2)}`, 400, doc.y);

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').text('Thank you for your business!', { align: 'center' });
    doc.text('This is a computer generated invoice.', { align: 'center' });

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
