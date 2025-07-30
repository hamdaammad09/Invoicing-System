const axios = require('axios');
const FbrApiSetting = require('../models/fbrApiSetting');

class FbrApiService {
  constructor() {
    this.settings = null;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // Initialize API settings
  async initialize() {
    try {
      this.settings = await FbrApiSetting.findOne().sort({ updatedAt: -1 });
      if (!this.settings) {
        throw new Error('FBR API settings not configured. Please configure API settings first.');
      }
      
      // Validate required settings
      if (!this.settings.clientId || !this.settings.clientSecret || !this.settings.apiUrl) {
        throw new Error('Incomplete FBR API settings. Please provide Client ID, Client Secret, and API URL.');
      }
      
      console.log('✅ FBR API settings loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize FBR API service:', error);
      return false;
    }
  }

  // Get access token from FBR
  async getAccessToken() {
    try {
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(`${this.settings.apiUrl}/auth/token`, {
        client_id: this.settings.clientId,
        client_secret: this.settings.clientSecret,
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
      
      console.log('✅ FBR access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get FBR access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with FBR API');
    }
  }

  // Validate invoice data before submission
  async validateInvoice(invoiceData) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(`${this.settings.apiUrl}/invoice/validate`, {
        ...invoiceData,
        environment: this.settings.environment
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        isValid: response.data.valid,
        errors: response.data.errors || [],
        warnings: response.data.warnings || []
      };
    } catch (error) {
      console.error('❌ Invoice validation failed:', error.response?.data || error.message);
      return {
        isValid: false,
        errors: [error.response?.data?.message || 'Validation failed'],
        warnings: []
      };
    }
  }

  // Submit invoice to FBR
  async submitInvoice(invoiceData) {
    try {
      const token = await this.getAccessToken();
      
      const fbrPayload = this.formatInvoiceForFBR(invoiceData);
      
      const response = await axios.post(`${this.settings.apiUrl}/invoice/submit`, fbrPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        fbrReference: response.data.invoice_id,
        fbrResponse: response.data,
        submissionDate: new Date()
      };
    } catch (error) {
      console.error('❌ Invoice submission failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Submission failed',
        fbrResponse: error.response?.data
      };
    }
  }

  // Check invoice status in FBR
  async checkInvoiceStatus(fbrReference) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.settings.apiUrl}/invoice/status/${fbrReference}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        status: response.data.status,
        details: response.data
      };
    } catch (error) {
      console.error('❌ Status check failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Status check failed'
      };
    }
  }

  // Format invoice data for FBR API
  formatInvoiceForFBR(invoiceData) {
    return {
      invoice_number: invoiceData.invoiceNumber,
      buyer: {
        ntn: invoiceData.buyerNTN,
        strn: invoiceData.buyerSTRN,
        name: invoiceData.client?.companyName || invoiceData.client?.name
      },
      seller: {
        ntn: invoiceData.sellerNTN,
        strn: invoiceData.sellerSTRN
      },
      invoice_date: new Date().toISOString().split('T')[0],
      total_amount: invoiceData.totalAmount,
      sales_tax: invoiceData.salesTax,
      extra_tax: invoiceData.extraTax || 0,
      items: invoiceData.items.map(item => ({
        description: item.description,
        hs_code: item.hsCode,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_value: item.totalValue,
        sales_tax: item.salesTax
      })),
      environment: this.settings.environment
    };
  }

  // Test FBR API connection
  async testConnection() {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.settings.apiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        message: 'FBR API connection successful',
        environment: this.settings.environment,
        apiUrl: this.settings.apiUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Connection test failed',
        environment: this.settings.environment,
        apiUrl: this.settings.apiUrl
      };
    }
  }
}

module.exports = new FbrApiService(); 