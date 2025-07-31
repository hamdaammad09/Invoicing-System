// api/index.js
const app = require('../app');

// Add a test route to check if the main app is working
app.get('/api-test-debug', (req, res) => {
  res.json({
    message: 'API debug test',
    routes: [
      '/api/clients',
      '/api/services', 
      '/api/tasks',
      '/api/dashboard',
      '/api/invoices'
    ],
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

// Test HS codes route
app.get('/test-hscodes', (req, res) => {
  const { findHSCode } = require('../utils/hsCodeDatabase');
  
  const testResults = {
    'poultry meal': findHSCode('poultry meal'),
    'poultry oil': findHSCode('poultry oil'),
    'chicken meal': findHSCode('chicken meal'),
    'chicken oil': findHSCode('chicken oil'),
    'poultry': findHSCode('poultry'),
    'meal': findHSCode('meal'),
    'oil': findHSCode('oil')
  };
  
  res.json({
    message: 'HS Code test results',
    testResults,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;