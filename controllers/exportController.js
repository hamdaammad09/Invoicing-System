const Invoice = require('../models/invoice');
const Client = require('../models/client');
const SellerSettings = require('../models/sellerSettings');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');

// CSV Export (More reliable for cross-platform compatibility)
exports.exportInvoicesToCSV = async (req, res) => {
  try {
    console.log('🔄 Starting CSV export...');
    
    // Populate the referenced fields to get actual data
    const invoices = await Invoice.find()
      .populate('buyerId', 'name email phone address')
      .populate('sellerId', 'businessName businessAddress')
      .lean();
    
    console.log(`📊 Found ${invoices.length} invoices to export`);

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found to export' });
    }

    // Create CSV headers
    const headers = [
      'Invoice ID',
      'Invoice Number', 
      'Buyer Name',
      'Buyer Email',
      'Seller Name',
      'Items Count',
      'Total Value',
      'Sales Tax',
      'Extra Tax',
      'Final Value',
      'Status',
      'Issue Date',
      'IRN'
    ];

    // Create CSV content
    let csvContent = headers.join(',') + '\n';

    // Add data rows
    invoices.forEach((invoice, index) => {
      try {
        console.log(`📝 Processing invoice ${index + 1}: ${invoice._id}`);
        
        // Calculate totals from items array
        let totalValue = 0;
        let totalSalesTax = 0;
        let totalExtraTax = 0;
        let totalFinalValue = 0;
        
        if (Array.isArray(invoice.items) && invoice.items.length > 0) {
          invoice.items.forEach(item => {
            totalValue += (item.totalValue || 0);
            totalSalesTax += (item.salesTax || 0);
            totalExtraTax += (item.extraTax || 0);
            totalFinalValue += (item.finalValue || 0);
          });
        } else {
          // Fallback to individual fields if items array is empty
          totalValue = invoice.totalValue || 0;
          totalSalesTax = invoice.salesTax || 0;
          totalExtraTax = invoice.extraTax || 0;
          totalFinalValue = invoice.finalValue || 0;
        }
        
        // Escape CSV values and create row
        const row = [
          `"${invoice._id.toString()}"`,
          `"${invoice.invoiceNumber || 'N/A'}"`,
          `"${(invoice.buyerId?.name || invoice.buyerInfo?.name || 'N/A').replace(/"/g, '""')}"`,
          `"${(invoice.buyerId?.email || invoice.buyerInfo?.email || 'N/A').replace(/"/g, '""')}"`,
          `"${(invoice.sellerId?.businessName || invoice.sellerInfo?.businessName || 'N/A').replace(/"/g, '""')}"`,
          Array.isArray(invoice.items) ? invoice.items.length : 0,
          totalValue,
          totalSalesTax,
          totalExtraTax,
          totalFinalValue,
          `"${invoice.status || 'pending'}"`,
          `"${invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().split('T')[0] : 'N/A'}"`,
          `"${invoice.irn || 'N/A'}"`
        ];
        
        csvContent += row.join(',') + '\n';
      } catch (rowError) {
        console.error(`❌ Error processing invoice ${index + 1}:`, rowError);
        // Add error row
        const errorRow = [
          `"${invoice._id?.toString() || 'ERROR'}"`,
          '"ERROR"',
          '"ERROR"',
          '"ERROR"',
          '"ERROR"',
          0,
          0,
          0,
          0,
          0,
          '"ERROR"',
          '"ERROR"',
          '"ERROR"'
        ];
        csvContent += errorRow.join(',') + '\n';
      }
    });

    console.log('✅ CSV data prepared, sending response...');

    // Set proper headers for CSV file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

    // Send CSV content
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ CSV export error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      message: 'Failed to export CSV',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Excel Export (Improved for Vercel)
exports.exportInvoicesToExcel = async (req, res) => {
  try {
    console.log('🔄 Starting Excel export...');
    console.log('📋 ExcelJS version:', require('exceljs/package.json').version);
    
    // Populate the referenced fields to get actual data
    const invoices = await Invoice.find()
      .populate('buyerId', 'name email phone address')
      .populate('sellerId', 'businessName businessAddress')
      .lean();
    
    console.log(`📊 Found ${invoices.length} invoices to export`);

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices found to export' });
    }

    console.log('📋 Creating workbook...');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tax Consultancy System';
    workbook.lastModifiedBy = 'Tax Consultancy System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('Invoices');

    // Define columns based on actual model structure
    worksheet.columns = [
      { header: 'Invoice ID', key: '_id', width: 25 },
      { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
      { header: 'Buyer Name', key: 'buyerName', width: 30 },
      { header: 'Buyer Email', key: 'buyerEmail', width: 30 },
      { header: 'Seller Name', key: 'sellerName', width: 30 },
      { header: 'Items Count', key: 'itemsCount', width: 15 },
      { header: 'Total Value', key: 'totalValue', width: 15 },
      { header: 'Sales Tax', key: 'salesTax', width: 15 },
      { header: 'Extra Tax', key: 'extraTax', width: 15 },
      { header: 'Final Value', key: 'finalValue', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Issue Date', key: 'issuedDate', width: 20 },
      { header: 'IRN', key: 'irn', width: 25 },
    ];

    console.log('📋 Styling header row...');
    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    console.log('📝 Adding data rows...');
    // Add data rows
    invoices.forEach((invoice, index) => {
      try {
        console.log(`📝 Processing invoice ${index + 1}: ${invoice._id}`);
        
        // Calculate totals from items array
        let totalValue = 0;
        let totalSalesTax = 0;
        let totalExtraTax = 0;
        let totalFinalValue = 0;
        
        if (Array.isArray(invoice.items) && invoice.items.length > 0) {
          invoice.items.forEach(item => {
            totalValue += (item.totalValue || 0);
            totalSalesTax += (item.salesTax || 0);
            totalExtraTax += (item.extraTax || 0);
            totalFinalValue += (item.finalValue || 0);
          });
        } else {
          // Fallback to individual fields if items array is empty
          totalValue = invoice.totalValue || 0;
          totalSalesTax = invoice.salesTax || 0;
          totalExtraTax = invoice.extraTax || 0;
          totalFinalValue = invoice.finalValue || 0;
        }
        
        const rowData = {
          _id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber || 'N/A',
          buyerName: invoice.buyerId?.name || invoice.buyerInfo?.name || 'N/A',
          buyerEmail: invoice.buyerId?.email || invoice.buyerInfo?.email || 'N/A',
          sellerName: invoice.sellerId?.businessName || invoice.sellerInfo?.businessName || 'N/A',
          itemsCount: Array.isArray(invoice.items) ? invoice.items.length : 0,
          totalValue: totalValue,
          salesTax: totalSalesTax,
          extraTax: totalExtraTax,
          finalValue: totalFinalValue,
          status: invoice.status || 'pending',
          issuedDate: invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().split('T')[0] : 'N/A',
          irn: invoice.irn || 'N/A',
        };
        
        const row = worksheet.addRow(rowData);
        
        // Style data rows
        row.alignment = { vertical: 'middle' };
        
        // Add borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
        
      } catch (rowError) {
        console.error(`❌ Error processing invoice ${index + 1}:`, rowError);
        // Add a row with error information
        const errorRow = worksheet.addRow({
          _id: invoice._id?.toString() || 'ERROR',
          invoiceNumber: 'ERROR',
          buyerName: 'ERROR',
          buyerEmail: 'ERROR',
          sellerName: 'ERROR',
          itemsCount: 0,
          totalValue: 0,
          salesTax: 0,
          extraTax: 0,
          finalValue: 0,
          status: 'ERROR',
          issuedDate: 'ERROR',
          irn: 'ERROR',
        });
        
        // Style error row
        errorRow.font = { color: { argb: 'FFFF0000' } };
      }
    });

    console.log('✅ Excel data prepared, writing to response...');

    // Set proper headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log('📋 Writing Excel buffer...');
    // Write to response buffer first, then send
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('✅ Excel buffer created, sending response...');
    console.log('📊 Buffer size:', buffer.length, 'bytes');
    
    // Set content length
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  } catch (error) {
    console.error('❌ Excel export error:', error);
    console.error('Error stack:', error.stack);
    
    // Send a more detailed error response
    res.status(500).json({ 
      message: 'Failed to export Excel',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Simple CSV test function
exports.testCSVGeneration = async (req, res) => {
  try {
    console.log('🧪 Testing CSV generation...');
    
    // Create simple test CSV data
    const headers = ['Name', 'Value', 'Date'];
    let csvContent = headers.join(',') + '\n';
    
    // Add test rows
    csvContent += '"Test Item 1",100,"2024-01-01"\n';
    csvContent += '"Test Item 2",200,"2024-01-02"\n';
    csvContent += '"Test Item 3",300,"2024-01-03"\n';
    
    console.log('✅ Test CSV data prepared, sending response...');
    
    // Set proper headers for CSV file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="test-export.csv"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
    
    // Send CSV content
    res.send(csvContent);
    
  } catch (error) {
    console.error('❌ Test CSV generation error:', error);
    res.status(500).json({ 
      message: 'Test CSV generation failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Simple Excel test function
exports.testExcelGeneration = async (req, res) => {
  try {
    console.log('🧪 Testing Excel generation...');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');
    
    // Add simple test data
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Value', key: 'value', width: 15 },
    ];
    
    worksheet.addRow({ name: 'Test Item 1', value: 100 });
    worksheet.addRow({ name: 'Test Item 2', value: 200 });
    worksheet.addRow({ name: 'Test Item 3', value: 300 });
    
    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    console.log('✅ Test Excel data prepared, writing to response...');
    
    // Set proper headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="test-export.xlsx"');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('✅ Test Excel buffer created, sending response...');
    
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Test Excel generation error:', error);
    res.status(500).json({ 
      message: 'Test Excel generation failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Test export function for debugging
exports.testExport = async (req, res) => {
  try {
    console.log('🧪 Starting test export...');
    
    // Get sample data without population first
    const sampleInvoices = await Invoice.find().limit(3).lean();
    console.log('📊 Sample invoices found:', sampleInvoices.length);
    
    if (sampleInvoices.length === 0) {
      return res.json({ 
        message: 'No invoices found in database',
        sampleData: null,
        modelFields: Object.keys(Invoice.schema.paths)
      });
    }
    
    // Show the structure of the first invoice
    const firstInvoice = sampleInvoices[0];
    console.log('📋 First invoice structure:', Object.keys(firstInvoice));
    
    return res.json({
      message: 'Test export data retrieved successfully',
      invoiceCount: sampleInvoices.length,
      sampleInvoice: {
        id: firstInvoice._id,
        invoiceNumber: firstInvoice.invoiceNumber,
        buyerId: firstInvoice.buyerId,
        sellerId: firstInvoice.sellerId,
        buyerInfo: firstInvoice.buyerInfo,
        sellerInfo: firstInvoice.sellerInfo,
        items: firstInvoice.items,
        status: firstInvoice.status,
        issuedDate: firstInvoice.issuedDate,
        hasItemsArray: Array.isArray(firstInvoice.items),
        itemsCount: Array.isArray(firstInvoice.items) ? firstInvoice.items.length : 0
      },
      modelFields: Object.keys(Invoice.schema.paths),
      availableFields: [
        'invoiceNumber', 'buyerId', 'sellerId', 'buyerInfo', 'sellerInfo',
        'items', 'digitalSignature', 'irn', 'qrCode', 'issuedDate', 'status',
        'product', 'units', 'unitPrice', 'totalValue', 'salesTax', 'extraTax', 'finalValue'
      ]
    });
    
  } catch (error) {
    console.error('❌ Test export error:', error);
    res.status(500).json({ 
      message: 'Test export failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// PDF Export
exports.exportInvoicesToPDF = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('buyerId', 'name email phone address')
      .populate('sellerId', 'businessName businessAddress')
      .lean();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoices.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Invoice Report', { align: 'center' }).moveDown(1);

    invoices.forEach((invoice, index) => {
      // Calculate totals
      let totalValue = 0;
      let totalFinalValue = 0;
      
      if (Array.isArray(invoice.items) && invoice.items.length > 0) {
        invoice.items.forEach(item => {
          totalValue += (item.totalValue || 0);
          totalFinalValue += (item.finalValue || 0);
        });
      } else {
        totalValue = invoice.totalValue || 0;
        totalFinalValue = invoice.finalValue || 0;
      }
      
      doc
        .fontSize(12)
        .text(`Invoice #${index + 1}`, { underline: true })
        .text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`)
        .text(`Buyer: ${invoice.buyerId?.name || invoice.buyerInfo?.name || 'N/A'}`)
        .text(`Seller: ${invoice.sellerId?.businessName || invoice.sellerInfo?.businessName || 'N/A'}`)
        .text(`Total Value: ₹${totalValue}`)
        .text(`Final Value: ₹${totalFinalValue}`)
        .text(`Status: ${invoice.status || 'pending'}`)
        .text(`Issue Date: ${invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().split('T')[0] : 'N/A'}`)
        .moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
};
