const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://192.168.100.100:3001',
  credentials: true
}));
app.use(express.json());

// ===== Route Imports =====
const clientRoutes = require('./routes/clientRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const fbrInvoiceRoutes = require('./routes/fbrInvoiceRoutes');
const userRoutes = require('./routes/userRoutes'); // 🔹 Includes user roles + permissions
const apiSettingsRoutes = require('./routes/fbrApiSettingsRoutes');
const exportRoutes = require('./routes/exportRoutes'); // Optional: if you're exporting to PDF/Excel

// ===== Route Usage =====
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/fbr-invoices', fbrInvoiceRoutes);
app.use('/api/users', userRoutes); // 🔹 Includes /meta/permissions for permissions page
app.use('/api/fbr-api-settings', apiSettingsRoutes);
app.use('/api/export', exportRoutes); // Optional

// ===== Health Check / Root Route =====
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});