const axios = require('axios');
const fbrAuthService = require('./fbrAuthService');
const mockFbrService = require('./mockFbrService');

class FbrApiService {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize API service with authentication
  async initialize() {
    try {
      console.log('🚀 Initializing FBR API Service...');
      
      // Initialize authentication service
      const authInitialized = await fbrAuthService.initialize();
      
      if (!authInitialized) {
        console.log('⚠️ FBR authentication not available');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ FBR API Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize FBR API service:', error);
      return false;
    }
  }

  // Validate invoice data before submission
  async validateInvoice(invoiceData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!fbrAuthService.isAuthenticated()) {
        throw new Error('FBR authentication required. Please login first.');
      }

      console.log('�� Validating invoice data...');

      // Validate required fields
      const validation = this.validateInvoiceData(invoiceData);
      if (!validation.isValid) {
        return validation;
      }

      // For now, use mock validation (replace with actual FBR validation API)
      const mockValidation = await mockFbrService.validateInvoice(invoiceData);
      
      console.log('✅ Invoice validation completed');
      return mockValidation;
    } catch (error) {
      console.error('❌ Invoice validation failed:', error.message);
      return {
        isValid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  // Submit invoice to FBR
  async submitInvoice(invoiceData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!fbrAuthService.isAuthenticated()) {
        throw new Error('FBR authentication required. Please login first.');
      }

      console.log('�� Submitting invoice to FBR...');

      // Validate invoice data first
      const validation = await this.validateInvoice(invoiceData);
      if (!validation.isValid) {
        throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
      }

      // Format invoice for FBR (only buyer info and invoice details)
      const fbrPayload = this.formatInvoiceForFBR(invoiceData);
      
      // Get access token
      const accessToken = fbrAuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      // Get seller info for logging
      const sellerInfo = fbrAuthService.getSellerInfo();
      console.log('🏢 Submitting as seller:', sellerInfo.businessName);

      // Submit to FBR (using mock service for now)
      const response = await mockFbrService.submitInvoice(fbrPayload, accessToken);

      if (response.success) {
        console.log('✅ Invoice submitted successfully to FBR');
        console.log('�� FBR Response:', {
          uuid: response.uuid,
          irn: response.irn,
          qrCode: response.qrCode
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Invoice submission failed:', error.message);
      return {
        success: false,
        error: error.message,
        fbrReference: null,
        uuid: null,
        irn: null,
        qrCode: null
      };
    }
  }

  // Check invoice status
  async checkInvoiceStatus(fbrReference) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!fbrAuthService.isAuthenticated()) {
        throw new Error('FBR authentication required');
      }

      const accessToken = fbrAuthService.getAccessToken();
      
      // Use mock service for now
      const response = await mockFbrService.checkStatus(fbrReference, accessToken);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to check invoice status:', error.message);
      return {
        success: false,
        error: error.message,
        status: 'unknown'
      };
    }
  }

  // Format invoice data for FBR submission
  formatInvoiceForFBR(invoiceData) {
    try {
      console.log('�� Formatting invoice for FBR submission...');

      // FBR payload structure (seller info is auto-attached by FBR)
      const fbrPayload = {
        // Invoice header
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate || new Date().toISOString().split('T')[0],
        due_date: invoiceData.dueDate,
        
        // Buyer information (required by FBR)
        buyer: {
          name: invoiceData.buyerName,
          ntn: invoiceData.buyerNTN || '',
          strn: invoiceData.buyerSTRN || '',
          address: invoiceData.buyerAddress,
          phone: invoiceData.buyerPhone || '',
          email: invoiceData.buyerEmail || ''
        },
        
        // Invoice items
        items: invoiceData.items.map(item => ({
          description: item.description,
          hs_code: item.hsCode || '',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_value: item.totalValue,
          sales_tax: item.salesTax || 0,
          discount: item.discount || 0
        })),
        
        // Invoice totals
        total_amount: invoiceData.totalAmount,
        sales_tax: invoiceData.salesTax || 0,
        extra_tax: invoiceData.extraTax || 0,
        discount: invoiceData.discount || 0,
        final_amount: invoiceData.finalAmount,
        
        // Additional metadata
        currency: 'PKR',
        exchange_rate: 1,
        notes: invoiceData.notes || ''
      };

      console.log('✅ Invoice formatted for FBR');
      return fbrPayload;
    } catch (error) {
      console.error('❌ Error formatting invoice for FBR:', error);
      throw new Error('Failed to format invoice data for FBR submission');
    }
  }

  // Validate invoice data structure
  validateInvoiceData(invoiceData) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!invoiceData.invoiceNumber) {
      errors.push('Invoice number is required');
    }

    if (!invoiceData.buyerName) {
      errors.push('Buyer name is required');
    }

    if (!invoiceData.buyerAddress) {
      errors.push('Buyer address is required');
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (!invoiceData.finalAmount || invoiceData.finalAmount <= 0) {
      errors.push('Final amount must be greater than 0');
    }

    // Validate items
    if (invoiceData.items) {
      invoiceData.items.forEach((item, index) => {
        if (!item.description) {
          errors.push(`Item ${index + 1}: Description is required`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }
        if (!item.unitPrice || item.unitPrice <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
        }
      });
    }

    // Warnings
    if (!invoiceData.buyerNTN && !invoiceData.buyerSTRN) {
      warnings.push('Buyer NTN or STRN is recommended for tax compliance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Test FBR connection
  async testConnection() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!fbrAuthService.isAuthenticated()) {
        return {
          success: false,
          message: 'FBR authentication required. Please login first.',
          sellerInfo: null
        };
      }

      const sellerInfo = fbrAuthService.getSellerInfo();
      
      return {
        success: true,
        message: 'FBR connection successful',
        sellerInfo,
        environment: sellerInfo.environment
      };
    } catch (error) {
      console.error('❌ FBR connection test failed:', error);
      return {
        success: false,
        message: 'FBR connection failed',
        error: error.message
      };
    }
  }
}

module.exports = new FbrApiService();