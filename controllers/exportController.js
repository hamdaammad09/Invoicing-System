const Invoice = require('../models/invoice');
const Client = require('../models/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

// Excel Export
exports.exportInvoicesToExcel = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('client');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    worksheet.columns = [
      { header: 'Invoice ID', key: '_id', width: 25 },
      { header: 'Client Name', key: 'clientName', width: 25 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Issue Date', key: 'issueDate', width: 20 },
    ];

    invoices.forEach((invoice) => {
      worksheet.addRow({
        _id: invoice._id.toString(),
        clientName: invoice.client?.name || 'N/A',
        amount: invoice.amount,
        status: invoice.status,
        issueDate: invoice.issueDate.toISOString().split('T')[0],
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
    console.error(error);
    res.status(500).json({ message: 'Failed to export Excel' });
  }
};

// PDF Export
exports.exportInvoicesToPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('client');

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Invoice Report', { align: 'center' }).moveDown(1);

    invoices.forEach((invoice, index) => {
      doc
        .fontSize(12)
        .text(`Invoice #${index + 1}`, { underline: true })
        .text(`Client: ${invoice.client?.name || 'N/A'}`)
        .text(`Amount: ${invoice.amount}`)
        .text(`Status: ${invoice.status}`)
        .text(`Issue Date: ${invoice.issueDate.toISOString().split('T')[0]}`)
        .moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
};
