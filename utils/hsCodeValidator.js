// HS Code Validator for FBR Integration
class HSCodeValidator {
  constructor() {
    // Common HS codes for different product categories
    this.commonHSCodes = {
      'electronics': ['8517.12.00', '8517.13.00', '8517.14.00'],
      'textiles': ['5208.52.00', '5208.53.00', '5208.59.00'],
      'machinery': ['8429.51.00', '8429.52.00', '8429.59.00'],
      'chemicals': ['2815.12.00', '2815.13.00', '2815.14.00'],
      'food': ['1001.90.00', '1002.90.00', '1003.90.00']
    };
  }

  // Validate HS code format (XXXX.XX.XX)
  validateFormat(hsCode) {
    if (!hsCode || typeof hsCode !== 'string') {
      return { isValid: false, error: 'HS Code is required and must be a string' };
    }

    const hsCodePattern = /^\d{4}\.\d{2}\.\d{2}$/;
    if (!hsCodePattern.test(hsCode)) {
      return { 
        isValid: false, 
        error: 'Invalid HS Code format. Use format: XXXX.XX.XX (e.g., 8517.12.00)' 
      };
    }

    return { isValid: true };
  }

  // Check if HS code exists in common categories
  validateCategory(hsCode) {
    const formatValidation = this.validateFormat(hsCode);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    // Check if HS code exists in any category
    for (const [category, codes] of Object.entries(this.commonHSCodes)) {
      if (codes.includes(hsCode)) {
        return { 
          isValid: true, 
          category: category,
          message: `HS Code ${hsCode} is valid for ${category} category`
        };
      }
    }

    // If not in common categories, still valid but unknown category
    return { 
      isValid: true, 
      category: 'unknown',
      message: `HS Code ${hsCode} format is valid but category is unknown`
    };
  }

  // Get HS code suggestions based on description
  getSuggestions(description) {
    const suggestions = [];
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('phone') || lowerDesc.includes('mobile') || lowerDesc.includes('smartphone')) {
      suggestions.push(...this.commonHSCodes.electronics);
    } else if (lowerDesc.includes('cloth') || lowerDesc.includes('fabric') || lowerDesc.includes('textile')) {
      suggestions.push(...this.commonHSCodes.textiles);
    } else if (lowerDesc.includes('machine') || lowerDesc.includes('equipment') || lowerDesc.includes('machinery')) {
      suggestions.push(...this.commonHSCodes.machinery);
    } else if (lowerDesc.includes('chemical') || lowerDesc.includes('acid') || lowerDesc.includes('base')) {
      suggestions.push(...this.commonHSCodes.chemicals);
    } else if (lowerDesc.includes('food') || lowerDesc.includes('grain') || lowerDesc.includes('wheat')) {
      suggestions.push(...this.commonHSCodes.food);
    }

    return suggestions;
  }

  // Validate complete item data for FBR
  validateItem(item) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!item.description) {
      errors.push('Item description is required');
    }

    if (!item.hsCode) {
      errors.push('HS Code is required');
    } else {
      const hsValidation = this.validateFormat(item.hsCode);
      if (!hsValidation.isValid) {
        errors.push(hsValidation.error);
      }
    }

    if (!item.quantity || item.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (!item.unitPrice || item.unitPrice <= 0) {
      errors.push('Unit price must be greater than 0');
    }

    // Calculate and validate totals
    if (item.quantity && item.unitPrice) {
      const calculatedTotal = item.quantity * item.unitPrice;
      if (item.totalValue && Math.abs(calculatedTotal - item.totalValue) > 0.01) {
        warnings.push(`Total value mismatch. Calculated: ${calculatedTotal}, Provided: ${item.totalValue}`);
      }
    }

    // Sales tax validation
    if (item.salesTax && item.salesTax < 0) {
      errors.push('Sales tax cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get all common HS codes
  getAllCommonCodes() {
    const allCodes = [];
    for (const codes of Object.values(this.commonHSCodes)) {
      allCodes.push(...codes);
    }
    return allCodes.sort();
  }

  // Get HS codes by category
  getCodesByCategory(category) {
    return this.commonHSCodes[category] || [];
  }
}

module.exports = new HSCodeValidator(); 