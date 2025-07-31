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

module.exports = app;