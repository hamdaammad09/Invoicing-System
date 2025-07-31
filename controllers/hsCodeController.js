const { 
  findHSCode, 
  getHSCodeSuggestions, 
  validateHSCode, 
  getHSCodeDescription,
  hsCodeDatabase 
} = require('../utils/hsCodeDatabase');

// Get HS code for a description
exports.getHSCode = async (req, res) => {
  try {
    const { description } = req.query;
    
    if (!description) {
      return res.status(400).json({ 
        message: 'Description is required',
        error: 'MISSING_DESCRIPTION'
      });
    }
    
    const hsCode = findHSCode(description);
    const suggestions = getHSCodeSuggestions(description, 3);
    
    console.log('🔍 HS Code lookup:', {
      description: description,
      suggestedCode: hsCode,
      suggestions: suggestions.length
    });
    
    res.json({
      description: description,
      hsCode: hsCode,
      suggestions: suggestions,
      isValid: validateHSCode(hsCode),
      message: 'HS Code found successfully'
    });
    
  } catch (error) {
    console.error('❌ HS Code lookup error:', error);
    res.status(500).json({ 
      message: 'Failed to get HS code',
      error: error.message 
    });
  }
};

// Get multiple suggestions for a description
exports.getHSCodeSuggestions = async (req, res) => {
  try {
    const { description, limit = 5 } = req.query;
    
    if (!description) {
      return res.status(400).json({ 
        message: 'Description is required',
        error: 'MISSING_DESCRIPTION'
      });
    }
    
    const suggestions = getHSCodeSuggestions(description, parseInt(limit));
    
    console.log('🔍 HS Code suggestions:', {
      description: description,
      suggestionsCount: suggestions.length
    });
    
    res.json({
      description: description,
      suggestions: suggestions,
      count: suggestions.length,
      message: 'HS Code suggestions retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ HS Code suggestions error:', error);
    res.status(500).json({ 
      message: 'Failed to get HS code suggestions',
      error: error.message 
    });
  }
};

// Validate HS code format
exports.validateHSCode = async (req, res) => {
  try {
    const { hsCode } = req.query;
    
    if (!hsCode) {
      return res.status(400).json({ 
        message: 'HS Code is required',
        error: 'MISSING_HS_CODE'
      });
    }
    
    const isValid = validateHSCode(hsCode);
    const description = getHSCodeDescription(hsCode);
    
    console.log('🔍 HS Code validation:', {
      hsCode: hsCode,
      isValid: isValid,
      description: description
    });
    
    res.json({
      hsCode: hsCode,
      isValid: isValid,
      description: description,
      message: isValid ? 'HS Code is valid' : 'HS Code format is invalid'
    });
    
  } catch (error) {
    console.error('❌ HS Code validation error:', error);
    res.status(500).json({ 
      message: 'Failed to validate HS code',
      error: error.message 
    });
  }
};

// Get all available HS codes and descriptions
exports.getAllHSCodes = async (req, res) => {
  try {
    const { category } = req.query;
    
    let codes = [];
    
    if (category) {
      // Filter by category if provided
      for (const [key, hsCode] of Object.entries(hsCodeDatabase)) {
        if (key.toLowerCase().includes(category.toLowerCase())) {
          codes.push({
            description: key,
            hsCode: hsCode
          });
        }
      }
    } else {
      // Return all codes
      for (const [key, hsCode] of Object.entries(hsCodeDatabase)) {
        if (key !== "default") { // Exclude default
          codes.push({
            description: key,
            hsCode: hsCode
          });
        }
      }
    }
    
    console.log('🔍 All HS Codes:', {
      category: category || 'all',
      count: codes.length
    });
    
    res.json({
      codes: codes,
      count: codes.length,
      category: category || 'all',
      message: 'HS Codes retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Get all HS codes error:', error);
    res.status(500).json({ 
      message: 'Failed to get HS codes',
      error: error.message 
    });
  }
};

// Auto-complete endpoint for HS code descriptions
exports.autoComplete = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        message: 'Query must be at least 2 characters long',
        error: 'QUERY_TOO_SHORT'
      });
    }
    
    const searchQuery = query.toLowerCase();
    const matches = [];
    
    for (const [key, hsCode] of Object.entries(hsCodeDatabase)) {
      if (key === "default") continue;
      
      if (key.toLowerCase().includes(searchQuery)) {
        matches.push({
          description: key,
          hsCode: hsCode
        });
        
        if (matches.length >= parseInt(limit)) {
          break;
        }
      }
    }
    
    console.log('🔍 HS Code auto-complete:', {
      query: query,
      matches: matches.length
    });
    
    res.json({
      query: query,
      matches: matches,
      count: matches.length,
      message: 'Auto-complete results retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ HS Code auto-complete error:', error);
    res.status(500).json({ 
      message: 'Failed to get auto-complete suggestions',
      error: error.message 
    });
  }
};

// Test endpoint to verify HS code database
exports.testHSCodeDatabase = async (req, res) => {
  try {
    const testCases = [
      "tax consultation",
      "software development",
      "accounting",
      "legal services",
      "unknown service"
    ];
    
    const results = testCases.map(description => ({
      description: description,
      hsCode: findHSCode(description),
      suggestions: getHSCodeSuggestions(description, 2)
    }));
    
    console.log('🧪 HS Code database test completed');
    
    res.json({
      message: 'HS Code database test completed',
      results: results,
      databaseSize: Object.keys(hsCodeDatabase).length - 1, // Exclude default
      testCases: testCases.length
    });
    
  } catch (error) {
    console.error('❌ HS Code database test error:', error);
    res.status(500).json({ 
      message: 'Failed to test HS code database',
      error: error.message 
    });
  }
}; 