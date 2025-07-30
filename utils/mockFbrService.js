// Mock FBR Service for Testing
class MockFbrService {
  constructor() {
    this.mockInvoices = new Map();
    this.invoiceCounter = 1;
  }

  // Mock authentication
  async authenticate(clientId, clientSecret) {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (clientId && clientSecret) {
      return {
        success: true,
        access_token: `mock_token_${Date.now()}`,
        expires_in: 3600
      };
    } else {
      throw new Error('Invalid credentials');
    }
  }

  // Mock invoice validation
  async validateInvoice(invoiceData) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const errors = [];
    const warnings = [];

    // Basic validation
    if (!invoiceData.invoiceNumber) {
      errors.push('Invoice number is required');
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      errors.push('At least one item is required');
    }

    // HS Code validation
    if (invoiceData.items) {
      invoiceData.items.forEach((item, index) => {
        if (!item.hsCode) {
          errors.push(`Item ${index + 1}: HS Code is required`);
        } else if (!/^\d{4}\.\d{2}\.\d{2}$/.test(item.hsCode)) {
          errors.push(`Item ${index + 1}: Invalid HS Code format`);
        }
      });
    }

    // NTN/STRN validation
    if (!invoiceData.buyerNTN) {
      warnings.push('Buyer NTN is recommended');
    }
    if (!invoiceData.buyerSTRN) {
      warnings.push('Buyer STRN is recommended');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Mock invoice submission
  async submitInvoice(invoiceData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockInvoiceId = `FBR-MOCK-${this.invoiceCounter++}`;
    
    // Store mock invoice
    this.mockInvoices.set(mockInvoiceId, {
      ...invoiceData,
      fbrId: mockInvoiceId,
      status: 'submitted',
      submissionDate: new Date(),
      response: {
        success: true,
        invoice_id: mockInvoiceId,
        message: 'Invoice submitted successfully (MOCK)'
      }
    });

    return {
      success: true,
      fbrReference: mockInvoiceId,
      fbrResponse: {
        success: true,
        invoice_id: mockInvoiceId,
        message: 'Invoice submitted successfully (MOCK)'
      },
      submissionDate: new Date()
    };
  }

  // Mock status check
  async checkInvoiceStatus(fbrReference) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const mockInvoice = this.mockInvoices.get(fbrReference);
    
    if (!mockInvoice) {
      return {
        success: false,
        error: 'Invoice not found'
      };
    }

    // Simulate status progression
    const timeDiff = Date.now() - mockInvoice.submissionDate.getTime();
    let status = 'submitted';
    
    if (timeDiff > 30000) { // 30 seconds
      status = 'accepted';
    } else if (timeDiff > 15000) { // 15 seconds
      status = 'processing';
    }

    return {
      success: true,
      status,
      details: {
        invoice_id: fbrReference,
        status,
        timestamp: new Date().toISOString(),
        message: `Invoice status: ${status} (MOCK)`
      }
    };
  }

  // Mock connection test
  async testConnection() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Mock FBR API connection successful',
      environment: 'sandbox',
      apiUrl: 'mock://fbr.gov.pk/api/v1'
    };
  }
}

module.exports = new MockFbrService(); 