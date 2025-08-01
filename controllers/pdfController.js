const PDFDocument = require('pdfkit');
const fs = require('fs');

// Generate PDF for a single invoice with FBR data
const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    // Get invoice data from database
    const Invoice = require('../models/invoice');
    const Client = require('../models/client');
    const SellerSettings = require('../models/sellerSettings');
    const FbrInvoice = require('../models/fbrInvoice');
    
    const invoice = await Invoice.findById(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get FBR invoice data if available
    let fbrInvoice = null;
    if (invoice.fbrReference) {
      fbrInvoice = await FbrInvoice.findOne({ fbrReference: invoice.fbrReference });
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

    // Add FBR Reference Number if available
    if (fbrInvoice && fbrInvoice.fbrReference) {
      doc.fontSize(10).font('Helvetica-Bold').text('FBR Ref:', leftX, currentY + 40);
      doc.fontSize(10).font('Helvetica').text(fbrInvoice.fbrReference, leftX + 50, currentY + 40);
    }

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

    // ===== FBR COMPLIANCE SECTION =====
    if (fbrInvoice && (fbrInvoice.uuid || fbrInvoice.irn || fbrInvoice.qrCode)) {
      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica-Bold').text('FBR E-INVOICE COMPLIANCE', { align: 'center' });
      doc.moveDown(1);
      
      // Draw box around FBR section
      const fbrBoxY = doc.y - 10;
      const fbrBoxHeight = 80;
      doc.rect(leftX, fbrBoxY, 500, fbrBoxHeight).stroke();
      
      // FBR data in two columns
      const fbrLeftX = leftX + 10;
      const fbrRightX = leftX + 260;
      let fbrCurrentY = fbrBoxY + 15;
      
      // Left column
      if (fbrInvoice.uuid) {
        doc.fontSize(9).font('Helvetica-Bold').text('UUID:', fbrLeftX, fbrCurrentY);
        doc.fontSize(8).font('Helvetica').text(fbrInvoice.uuid, fbrLeftX + 40, fbrCurrentY);
        fbrCurrentY += 15;
      }
      
      if (fbrInvoice.irn) {
        doc.fontSize(9).font('Helvetica-Bold').text('IRN:', fbrLeftX, fbrCurrentY);
        doc.fontSize(8).font('Helvetica').text(fbrInvoice.irn, fbrLeftX + 40, fbrCurrentY);
        fbrCurrentY += 15;
      }
      
      if (fbrInvoice.fbrReference) {
        doc.fontSize(9).font('Helvetica-Bold').text('FBR Ref:', fbrLeftX, fbrCurrentY);
        doc.fontSize(8).font('Helvetica').text(fbrInvoice.fbrReference, fbrLeftX + 50, fbrCurrentY);
        fbrCurrentY += 15;
      }
      
      // Right column
      fbrCurrentY = fbrBoxY + 15;
      if (fbrInvoice.fbrSubmissionDate) {
        doc.fontSize(9).font('Helvetica-Bold').text('Submission Date:', fbrRightX, fbrCurrentY);
        doc.fontSize(8).font('Helvetica').text(new Date(fbrInvoice.fbrSubmissionDate).toLocaleDateString(), fbrRightX + 80, fbrCurrentY);
        fbrCurrentY += 15;
      }
      
      if (fbrInvoice.status) {
        doc.fontSize(9).font('Helvetica-Bold').text('Status:', fbrRightX, fbrCurrentY);
        doc.fontSize(8).font('Helvetica').text(fbrInvoice.status.toUpperCase(), fbrRightX + 50, fbrCurrentY);
        fbrCurrentY += 15;
      }
      
      if (fbrInvoice.fbrEnvironment) {
        doc.fontSize(9).font('Helvetica-Bold').text('Environment:', fbrRightX, fbrCurrentY);
        doc.fontSize(8).font('Helvetica').text(fbrInvoice.fbrEnvironment.toUpperCase(), fbrRightX + 70, fbrCurrentY);
      }
      
      // QR Code placeholder (you can add actual QR code generation here)
      if (fbrInvoice.qrCode) {
        doc.moveDown(1);
        doc.fontSize(9).font('Helvetica-Bold').text('QR Code Data:', { align: 'center' });
        doc.fontSize(6).font('Helvetica').text(fbrInvoice.qrCode.substring(0, 50) + '...', { align: 'center' });
      }
      
      doc.moveDown(2);
    }

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

// Generate FBR-specific invoice PDF
const generateFbrInvoicePDF = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    
    // Get FBR invoice data
    const FbrInvoice = require('../models/fbrInvoice');
    const Invoice = require('../models/invoice');
    const Client = require('../models/client');
    const SellerSettings = require('../models/sellerSettings');
    
    // Find FBR invoice by invoice number
    let fbrInvoice = await FbrInvoice.findOne({ invoiceNumber });
    
    // If FBR invoice doesn't exist, try to get regular invoice
    let invoice = await Invoice.findOne({ invoiceNumber });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // If no FBR invoice exists, create a basic one for display
    if (!fbrInvoice) {
      fbrInvoice = {
        invoiceNumber: invoice.invoiceNumber,
        status: 'draft',
        fbrEnvironment: 'sandbox',
        items: invoice.items || [],
        totalAmount: invoice.finalValue || 0,
        salesTax: invoice.salesTax || 0,
        extraTax: invoice.extraTax || 0,
        finalAmount: invoice.finalValue || 0,
        buyerName: invoice.buyerId?.companyName || 'N/A',
        buyerAddress: invoice.buyerId?.address || 'N/A',
        buyerNTN: invoice.buyerId?.buyerNTN || '',
        buyerSTRN: invoice.buyerId?.buyerSTRN || ''
      };
    }
    
    // Get seller settings
    let sellerSettings = await SellerSettings.findOne();
    if (!sellerSettings) {
      sellerSettings = new SellerSettings();
    }

    // Get buyer information
    let buyerInfo = null;
    if (fbrInvoice.buyer) {
      buyerInfo = await Client.findById(fbrInvoice.buyer);
    } else if (invoice.buyerId) {
      buyerInfo = await Client.findById(invoice.buyerId);
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fbr-invoice-${invoiceNumber}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // ===== FBR COMPLIANT INVOICE HEADER =====
    doc.fontSize(20).font('Helvetica-Bold').text('FBR E-INVOICE', { align: 'center' });
    doc.fontSize(16).font('Helvetica-Bold').text(sellerSettings.companyName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(sellerSettings.address, { align: 'center' });
    if (sellerSettings.phone) {
      doc.fontSize(10).font('Helvetica').text(`Tel: ${sellerSettings.phone}`, { align: 'center' });
    }
    doc.moveDown(1);

    // Draw line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ===== FBR REFERENCE SECTION =====
    doc.fontSize(14).font('Helvetica-Bold').text('FBR E-INVOICE REFERENCE', { align: 'center' });
    doc.moveDown(1);
    
    // FBR reference box
    const fbrRefBoxY = doc.y;
    const fbrRefBoxHeight = 60;
    doc.rect(50, fbrRefBoxY, 500, fbrRefBoxHeight).stroke();
    
    const fbrRefLeftX = 60;
    const fbrRefRightX = 310;
    let fbrRefY = fbrRefBoxY + 15;
    
    // Check if FBR data exists
    const hasFbrData = fbrInvoice.uuid || fbrInvoice.irn || fbrInvoice.fbrReference;
    
    if (hasFbrData) {
      // Left column
      if (fbrInvoice.uuid) {
        doc.fontSize(10).font('Helvetica-Bold').text('UUID:', fbrRefLeftX, fbrRefY);
        doc.fontSize(9).font('Helvetica').text(fbrInvoice.uuid, fbrRefLeftX + 50, fbrRefY);
        fbrRefY += 15;
      }
      
      if (fbrInvoice.irn) {
        doc.fontSize(10).font('Helvetica-Bold').text('IRN:', fbrRefLeftX, fbrRefY);
        doc.fontSize(9).font('Helvetica').text(fbrInvoice.irn, fbrRefLeftX + 50, fbrRefY);
        fbrRefY += 15;
      }
      
      // Right column
      fbrRefY = fbrRefBoxY + 15;
      if (fbrInvoice.fbrReference) {
        doc.fontSize(10).font('Helvetica-Bold').text('FBR Ref:', fbrRefRightX, fbrRefY);
        doc.fontSize(9).font('Helvetica').text(fbrInvoice.fbrReference, fbrRefRightX + 60, fbrRefY);
        fbrRefY += 15;
      }
      
      if (fbrInvoice.fbrSubmissionDate) {
        doc.fontSize(10).font('Helvetica-Bold').text('Submission Date:', fbrRefRightX, fbrRefY);
        doc.fontSize(9).font('Helvetica').text(new Date(fbrInvoice.fbrSubmissionDate).toLocaleDateString(), fbrRefRightX + 100, fbrRefY);
      }
    } else {
      // Show pending FBR submission message
      doc.fontSize(10).font('Helvetica-Bold').text('Status:', fbrRefLeftX, fbrRefY);
      doc.fontSize(9).font('Helvetica').text('Pending FBR Submission', fbrRefLeftX + 50, fbrRefY);
      fbrRefY += 15;
      
      doc.fontSize(10).font('Helvetica-Bold').text('Note:', fbrRefLeftX, fbrRefY);
      doc.fontSize(9).font('Helvetica').text('Submit to FBR to get UUID, IRN, and QR Code', fbrRefLeftX + 50, fbrRefY);
    }
    
    doc.moveDown(3);

    // ===== INVOICE DETAILS =====
    const leftX = 50;
    const rightX = 300;
    let currentY = doc.y;

    // Left column - Invoice details
    doc.fontSize(10).font('Helvetica-Bold').text('Invoice No:', leftX, currentY);
    doc.fontSize(10).font('Helvetica').text(invoiceNumber, leftX + 80, currentY);
    
    doc.fontSize(10).font('Helvetica-Bold').text('Date:', leftX, currentY + 20);
    doc.fontSize(10).font('Helvetica').text(fbrInvoice.invoiceDate ? new Date(fbrInvoice.invoiceDate).toLocaleDateString() : 'N/A', leftX + 50, currentY + 20);

    // Right column - Seller details
    doc.fontSize(10).font('Helvetica-Bold').text('NTN:', rightX, currentY);
    doc.fontSize(10).font('Helvetica').text(sellerSettings.sellerNTN, rightX + 40, currentY);
    
    doc.fontSize(10).font('Helvetica-Bold').text('STRN:', rightX, currentY + 20);
    doc.fontSize(10).font('Helvetica').text(sellerSettings.sellerSTRN, rightX + 40, currentY + 20);

    doc.moveDown(3);

    // ===== BUYER INFORMATION =====
    doc.fontSize(12).font('Helvetica-Bold').text('BUYER INFORMATION', leftX, doc.y);
    doc.moveDown(0.5);
    
    if (buyerInfo) {
      doc.fontSize(10).font('Helvetica').text(buyerInfo.companyName || buyerInfo.name, leftX, doc.y);
      doc.moveDown(0.5);
      if (buyerInfo.address) {
        doc.fontSize(10).font('Helvetica').text(buyerInfo.address, leftX, doc.y);
        doc.moveDown(0.5);
      }
    } else {
      doc.fontSize(10).font('Helvetica').text(fbrInvoice.buyerName, leftX, doc.y);
      doc.moveDown(0.5);
      if (fbrInvoice.buyerAddress) {
        doc.fontSize(10).font('Helvetica').text(fbrInvoice.buyerAddress, leftX, doc.y);
        doc.moveDown(0.5);
      }
    }

    // Buyer tax details
    const buyerLeftX = leftX;
    const buyerRightX = rightX;
    currentY = doc.y;

    if (fbrInvoice.buyerNTN) {
      doc.fontSize(10).font('Helvetica-Bold').text('Buyer NTN:', buyerLeftX, currentY);
      doc.fontSize(10).font('Helvetica').text(fbrInvoice.buyerNTN, buyerLeftX + 80, currentY);
    }
    
    if (fbrInvoice.buyerSTRN) {
      doc.fontSize(10).font('Helvetica-Bold').text('Buyer STRN:', buyerRightX, currentY);
      doc.fontSize(10).font('Helvetica').text(fbrInvoice.buyerSTRN, buyerRightX + 80, currentY);
    }

    doc.moveDown(3);

    // ===== INVOICE ITEMS TABLE =====
    const tableTop = doc.y + 10;
    
    // Table headers
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Quantity', 200, tableTop);
    doc.text('Unit Price', 250, tableTop);
    doc.text('Total Value', 320, tableTop);
    doc.text('Sales Tax', 390, tableTop);
    doc.text('Final Value', 460, tableTop);

    // Draw table header lines
    doc.moveTo(50, tableTop - 5).lineTo(550, tableTop - 5).stroke();
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

    // Add items
    let currentTableY = tableTop + 25;
    doc.fontSize(9).font('Helvetica');
    
    if (fbrInvoice.items && Array.isArray(fbrInvoice.items)) {
      fbrInvoice.items.forEach((item) => {
        doc.text(item.description || 'Item', 50, currentTableY);
        doc.text((item.quantity || 1).toString(), 200, currentTableY);
        doc.text(`₹${(item.unitPrice || 0).toFixed(2)}`, 250, currentTableY);
        doc.text(`₹${(item.totalValue || 0).toFixed(2)}`, 320, currentTableY);
        doc.text(`₹${(item.salesTax || 0).toFixed(2)}`, 390, currentTableY);
        doc.text(`₹${(item.totalValue + item.salesTax || 0).toFixed(2)}`, 460, currentTableY);
        
        currentTableY += 20;
      });
    }

    // Draw bottom line
    doc.moveTo(50, currentTableY + 5).lineTo(550, currentTableY + 5).stroke();

    // ===== INVOICE TOTALS =====
    doc.moveDown(2);
    const totalsY = doc.y;
    
    doc.fontSize(10).font('Helvetica-Bold').text('Total Amount:', 400, totalsY);
    doc.fontSize(10).font('Helvetica').text(`₹${(fbrInvoice.totalAmount || 0).toFixed(2)}`, 500, totalsY);
    
    doc.fontSize(10).font('Helvetica-Bold').text('Sales Tax:', 400, totalsY + 20);
    doc.fontSize(10).font('Helvetica').text(`₹${(fbrInvoice.salesTax || 0).toFixed(2)}`, 500, totalsY + 20);
    
    doc.fontSize(10).font('Helvetica-Bold').text('Extra Tax:', 400, totalsY + 40);
    doc.fontSize(10).font('Helvetica').text(`₹${(fbrInvoice.extraTax || 0).toFixed(2)}`, 500, totalsY + 40);
    
    doc.moveTo(400, totalsY + 50).lineTo(550, totalsY + 50).stroke();
    
    doc.fontSize(12).font('Helvetica-Bold').text('Final Amount:', 400, totalsY + 70);
    doc.fontSize(12).font('Helvetica-Bold').text(`₹${(fbrInvoice.finalAmount || 0).toFixed(2)}`, 500, totalsY + 70);

    // ===== FBR COMPLIANCE FOOTER =====
    doc.moveDown(3);
    doc.fontSize(10).font('Helvetica-Bold').text('FBR E-INVOICE COMPLIANCE CERTIFICATION', { align: 'center' });
    doc.moveDown(1);
    
    if (hasFbrData) {
      doc.fontSize(8).font('Helvetica').text('This invoice has been electronically submitted to FBR and is compliant with Pakistan E-Invoicing regulations.', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').text(`Status: ${fbrInvoice.status?.toUpperCase() || 'SUBMITTED'} | Environment: ${fbrInvoice.fbrEnvironment?.toUpperCase() || 'SANDBOX'}`, { align: 'center' });
    } else {
      doc.fontSize(8).font('Helvetica').text('This invoice is prepared for FBR E-Invoicing submission. Submit to FBR to get official compliance certification.', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(8).font('Helvetica').text('Status: PENDING SUBMISSION | Environment: SANDBOX', { align: 'center' });
    }

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
    console.error('Error generating FBR invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate FBR invoice PDF' });
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
  generateMultipleInvoicesPDF,
  generateFbrInvoicePDF
};
