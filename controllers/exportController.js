const Invoice = require('../models/invoice');
const Client = require('../models/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

// Excel Export
exports.exportInvoicesToExcel = async (req, res) => {
  try {
    const invoices = await Invoice.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    worksheet.columns = [
      { header: 'Invoice ID', key: '_id', width: 25 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Buyer Info', key: 'buyerInfo', width: 30 },
      { header: 'Items', key: 'items', width: 40 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Discount', key: 'discount', width: 15 },
      { header: 'GST', key: 'gst', width: 15 },
      { header: 'Income Tax', key: 'incomeTax', width: 15 },
      { header: 'Final Amount', key: 'finalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Issue Date', key: 'issuedDate', width: 20 },
    ];

    invoices.forEach((invoice) => {
      worksheet.addRow({
        _id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber || 'N/A',
        buyerInfo: typeof invoice.buyerInfo === 'string' ? invoice.buyerInfo : 'N/A',
        items: Array.isArray(invoice.items) ? invoice.items.map(item => item.name || item).join(', ') : invoice.items || 'N/A',
        totalAmount: invoice.totalAmount || 0,
        discount: invoice.discount || 0,
        gst: invoice.gst || 0,
        incomeTax: invoice.incomeTax || 0,
        finalAmount: invoice.finalAmount || 0,
        status: invoice.status || 'pending',
        issuedDate: invoice.issuedDate ? invoice.issuedDate.toISOString().split('T')[0] : 'N/A',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Failed to export Excel' });
  }
};

// PDF Export
exports.exportInvoicesToPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Invoice Report', { align: 'center' }).moveDown(1);

    invoices.forEach((invoice, index) => {
      doc
        .fontSize(12)
        .text(`Invoice #${index + 1}`, { underline: true })
        .text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`)
        .text(`Buyer Info: ${typeof invoice.buyerInfo === 'string' ? invoice.buyerInfo : 'N/A'}`)
        .text(`Total Amount: ₹${invoice.totalAmount || 0}`)
        .text(`Final Amount: ₹${invoice.finalAmount || 0}`)
        .text(`Status: ${invoice.status || 'pending'}`)
        .text(`Issue Date: ${invoice.issuedDate ? invoice.issuedDate.toISOString().split('T')[0] : 'N/A'}`)
        .moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
};
