const QRCode = require('qrcode');

// Generate QR code for FBR invoice
const generateFbrQRCode = async (fbrData) => {
  try {
    // Create QR code data string with FBR information
    const qrData = {
      uuid: fbrData.uuid,
      irn: fbrData.irn,
      fbrReference: fbrData.fbrReference,
      invoiceNumber: fbrData.invoiceNumber,
      sellerNTN: fbrData.sellerNTN,
      buyerNTN: fbrData.buyerNTN,
      totalAmount: fbrData.totalAmount,
      salesTax: fbrData.salesTax,
      finalAmount: fbrData.finalAmount,
      submissionDate: fbrData.fbrSubmissionDate
    };

    // Convert to JSON string
    const qrString = JSON.stringify(qrData);

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Generate simple QR code from text
const generateSimpleQRCode = async (text) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating simple QR code:', error);
    return null;
  }
};

module.exports = {
  generateFbrQRCode,
  generateSimpleQRCode
}; 