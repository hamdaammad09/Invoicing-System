const Invoice = require('../models/invoice');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Generate FBR-compliant invoice PDF
exports.generateFbrInvoicePDF = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required'
      });
    }

    // Get invoice with all details
    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('buyerId', 'companyName buyerNTN buyerSTRN address phone')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice has FBR reference
    if (!invoice.fbrReference) {
      return res.status(400).json({
        success: false,
        message: 'Invoice not yet submitted to FBR'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="FBR-Invoice-${invoiceNumber}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate QR code for FBR verification
    const qrData = `FBR_INVOICE:${invoice.fbrReference}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });

    // Add company header
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(invoice.sellerId?.companyName || 'COMPANY NAME', { align: 'center' });

    doc.fontSize(10)
       .font('Helvetica')
       .text(invoice.sellerId?.address || 'Company Address', { align: 'center' });

    doc.fontSize(10)
       .text(`Tel: ${invoice.sellerId?.phone || 'Phone Number'}`, { align: 'center' });

    doc.moveDown(0.5);

    // Add NTN, STRN, POS ID section
    const ntnText = `NTN #: ${invoice.sellerId?.sellerNTN || '-'}`;
    const strnText = `STRN #: ${invoice.sellerId?.sellerSTRN || '-'}`;
    const posText = `POS ID #: ${invoice.fbrReference || '-'}`;

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(ntnText, { align: 'right' })
       .text(strnText, { align: 'right' })
       .text(posText, { align: 'right' });

    doc.moveDown(1);

    // Add main title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('SALES TAX INVOICE', { align: 'center' });

    doc.moveDown(1);

    // Add invoice details
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`Invoice No.: ${invoice.invoiceNumber}`)
       .text(`Invoice Date: ${invoice.issuedDate.toLocaleDateString('en-GB')}`);

    doc.moveDown(1);

    // Add buyer details
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('To: M/s ' + (invoice.buyerId?.companyName || 'Client Name'))
       .font('Helvetica')
       .text('Address: ' + (invoice.buyerId?.address || 'Client Address'))
       .text('Telephone: ' + (invoice.buyerId?.phone || 'Client Phone'))
       .text('ST Reg No: ' + (invoice.buyerId?.buyerSTRN || 'Client STRN'))
       .text('N.T.N/C.N.I.C: ' + (invoice.buyerId?.buyerNTN || 'Client NTN'));

    doc.moveDown(1);

    // Add payment terms
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Terms of Payment: CASH');

    doc.moveDown(1);

    // Add items table header
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [30, 150, 80, 50, 60, 60, 50, 60];

    // Table headers
    const headers = ['S. No.', 'Description', 'H S Code', 'Quantity', 'Rate', 'Amount', 'Discount', 'Net Amount'];
    
    doc.fontSize(8)
       .font('Helvetica-Bold');

    headers.forEach((header, i) => {
      doc.text(header, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, {
        width: colWidths[i],
        align: 'center'
      });
    });

    // Add items
    let currentY = tableTop + 20;
    let totalAmount = 0;
    let totalDiscount = 0;
    let totalNetAmount = 0;

    invoice.items.forEach((item, index) => {
      const itemData = [
        (index + 1).toString(),
        item.product || item.description || '',
        item.hsCode || '9983.99.00',
        (item.quantity || 1).toFixed(2),
        (item.unitPrice || 0).toFixed(2),
        (item.totalValue || 0).toFixed(2),
        (item.discount || 0).toFixed(2),
        (item.finalValue || 0).toFixed(2)
      ];

      doc.fontSize(8)
         .font('Helvetica');

      itemData.forEach((text, i) => {
        doc.text(text, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), currentY, {
          width: colWidths[i],
          align: i === 1 ? 'left' : 'center'
        });
      });

      totalAmount += item.totalValue || 0;
      totalDiscount += item.discount || 0;
      totalNetAmount += item.finalValue || 0;
      currentY += 15;
    });

    // Add totals
    doc.moveDown(1);
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`Totals Rs.: ${totalAmount.toFixed(2)}`);

    // Add amount in words
    const amountInWords = numberToWords(totalNetAmount);
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Amount in Words: Rupees ${amountInWords} only.`);

    doc.moveDown(1);

    // Add summary of charges
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text('Summary of Charges:')
       .font('Helvetica')
       .text(`Gross Amount: ${totalAmount.toFixed(2)}`)
       .text(`Discount: ${totalDiscount.toFixed(2)}`)
       .text(`Total Excluding Sales Tax Rs.: ${(totalAmount - totalDiscount).toFixed(2)}`);

    // Calculate sales tax
    const salesTax = invoice.salesTax || (totalAmount * 0.18); // 18% default
    doc.text(`Sales Tax Rs.: ${salesTax.toFixed(2)}`);

    const totalIncludingTax = (totalAmount - totalDiscount) + salesTax;
    doc.font('Helvetica-Bold')
       .text(`Total Including Sales Tax Rs.: ${totalIncludingTax.toFixed(2)}`);

    doc.moveDown(1);

    // Add FBR details
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .text(`FBR Invoice #: ${invoice.fbrReference}`);

    // Add FBR logo placeholder
    doc.fontSize(8)
       .font('Helvetica')
       .text('FBR PAKISTAN POS Invoice Management System', { align: 'left' });

    // Add QR code
    doc.image(qrCodeDataURL, doc.page.width - 150, doc.y - 50, {
      width: 80,
      height: 80
    });

    doc.moveDown(2);

    // Add footer
    doc.fontSize(8)
       .font('Helvetica')
       .text('Powered By: Switcher Techno - 0324-2419744 / 0335-3058349 - www.switchertechno.com', { align: 'center' });

    // Finalize PDF
    doc.end();

    console.log('✅ FBR invoice PDF generated:', invoiceNumber);

  } catch (error) {
    console.error('❌ Error generating FBR invoice PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate FBR invoice PDF',
      error: error.message
    });
  }
};

// Generate FBR invoice data for frontend
exports.getFbrInvoiceData = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    if (!invoiceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required'
      });
    }

    // Get invoice with all details
    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('buyerId', 'companyName buyerNTN buyerSTRN address phone')
      .populate('sellerId', 'companyName sellerNTN sellerSTRN address phone');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice has FBR reference
    if (!invoice.fbrReference) {
      return res.status(400).json({
        success: false,
        message: 'Invoice not yet submitted to FBR'
      });
    }

    // Calculate totals
    const totalAmount = invoice.items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const totalDiscount = invoice.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalNetAmount = invoice.items.reduce((sum, item) => sum + (item.finalValue || 0), 0);
    const salesTax = invoice.salesTax || (totalAmount * 0.18);
    const totalIncludingTax = (totalAmount - totalDiscount) + salesTax;

    // Generate QR code data
    const qrData = `FBR_INVOICE:${invoice.fbrReference}`;

    const fbrInvoiceData = {
      // Company details
      companyName: invoice.sellerId?.companyName || 'COMPANY NAME',
      companyAddress: invoice.sellerId?.address || 'Company Address',
      companyPhone: invoice.sellerId?.phone || 'Phone Number',
      
      // Tax numbers
      sellerNTN: invoice.sellerId?.sellerNTN || '-',
      sellerSTRN: invoice.sellerId?.sellerSTRN || '-',
      fbrReference: invoice.fbrReference,
      
      // Invoice details
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.issuedDate.toLocaleDateString('en-GB'),
      
      // Buyer details
      buyerName: invoice.buyerId?.companyName || 'Client Name',
      buyerAddress: invoice.buyerId?.address || 'Client Address',
      buyerPhone: invoice.buyerId?.phone || 'Client Phone',
      buyerSTRN: invoice.buyerId?.buyerSTRN || 'Client STRN',
      buyerNTN: invoice.buyerId?.buyerNTN || 'Client NTN',
      
      // Items
      items: invoice.items.map((item, index) => ({
        serialNo: index + 1,
        description: item.product || item.description || '',
        hsCode: item.hsCode || '9983.99.00',
        quantity: (item.quantity || 1).toFixed(2),
        rate: (item.unitPrice || 0).toFixed(2),
        amount: (item.totalValue || 0).toFixed(2),
        discount: (item.discount || 0).toFixed(2),
        netAmount: (item.finalValue || 0).toFixed(2)
      })),
      
      // Totals
      totalAmount: totalAmount.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalExcludingTax: (totalAmount - totalDiscount).toFixed(2),
      salesTax: salesTax.toFixed(2),
      totalIncludingTax: totalIncludingTax.toFixed(2),
      amountInWords: numberToWords(totalNetAmount),
      
      // QR code data
      qrCodeData: qrData
    };

    console.log('📄 FBR invoice data generated:', invoiceNumber);

    res.json({
      success: true,
      fbrInvoice: fbrInvoiceData,
      message: 'FBR invoice data retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting FBR invoice data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get FBR invoice data',
      error: error.message
    });
  }
};

// Helper function to convert number to words
function numberToWords(num) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  function convertLessThanOneThousand(n) {
    if (n === 0) return '';

    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanOneThousand(n % 100) : '');
  }

  function convert(n) {
    if (n === 0) return 'zero';
    if (n < 1000) return convertLessThanOneThousand(n);
    if (n < 100000) return convertLessThanOneThousand(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convertLessThanOneThousand(n % 1000) : '');
    if (n < 10000000) return convertLessThanOneThousand(Math.floor(n / 100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convertLessThanOneThousand(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);

  let result = convert(rupees);
  if (paisa > 0) {
    result += ` and ${paisa}/100`;
  }

  return result;
} 