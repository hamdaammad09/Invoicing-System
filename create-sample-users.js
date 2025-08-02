const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const SellerSettings = require('./models/sellerSettings');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tax-consultancy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createSampleUsers = async () => {
  try {
    console.log('🚀 Creating sample users...');

    // Create seller settings first
    const sellerSettings1 = new SellerSettings({
      companyName: 'HS Softworks',
      sellerSTRN: 'STRN123456',
      sellerNTN: 'NTN123456',
      address: '123 Business Street, Karachi, Pakistan',
      phone: '+92-300-1234567',
      email: 'admin@hssoftworks.com',
      fbrClientId: 'test-client-id-1',
      fbrClientSecret: 'test-client-secret-1',
      fbrEnvironment: 'sandbox'
    });

    const sellerSettings2 = new SellerSettings({
      companyName: 'Tech Solutions Ltd',
      sellerSTRN: 'STRN789012',
      sellerNTN: 'NTN789012',
      address: '456 Tech Avenue, Lahore, Pakistan',
      phone: '+92-300-7654321',
      email: 'admin@techsolutions.com',
      fbrClientId: 'test-client-id-2',
      fbrClientSecret: 'test-client-secret-2',
      fbrEnvironment: 'sandbox'
    });

    await sellerSettings1.save();
    await sellerSettings2.save();

    console.log('✅ Seller settings created');

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create users
    const users = [
      {
        name: 'HS Softworks Admin',
        email: 'admin@hssoftworks.com',
        password: hashedPassword,
        role: 'admin',
        permissions: ['manage_users', 'system_settings', 'view_clients', 'manage_clients', 'view_invoices', 'manage_invoices', 'view_services', 'manage_services', 'fbr_submission', 'view_dashboard']
      },
      {
        name: 'HS Softworks Seller',
        email: 'seller@hssoftworks.com',
        password: hashedPassword,
        role: 'seller',
        sellerId: sellerSettings1._id,
        permissions: ['view_clients', 'manage_clients', 'view_invoices', 'manage_invoices', 'view_services', 'manage_services', 'fbr_submission', 'view_dashboard']
      },
      {
        name: 'HS Softworks Buyer',
        email: 'buyer@hssoftworks.com',
        password: hashedPassword,
        role: 'buyer',
        sellerId: sellerSettings1._id,
        permissions: ['view_invoices', 'view_dashboard']
      },
      {
        name: 'Tech Solutions Seller',
        email: 'seller@techsolutions.com',
        password: hashedPassword,
        role: 'seller',
        sellerId: sellerSettings2._id,
        permissions: ['view_clients', 'manage_clients', 'view_invoices', 'manage_invoices', 'view_services', 'manage_services', 'fbr_submission', 'view_dashboard']
      },
      {
        name: 'Tech Solutions Buyer',
        email: 'buyer@techsolutions.com',
        password: hashedPassword,
        role: 'buyer',
        sellerId: sellerSettings2._id,
        permissions: ['view_invoices', 'view_dashboard']
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${userData.name} (${userData.role})`);
    }

    console.log('\n🎉 Sample users created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@hssoftworks.com / password123');
    console.log('Seller 1: seller@hssoftworks.com / password123');
    console.log('Buyer 1: buyer@hssoftworks.com / password123');
    console.log('Seller 2: seller@techsolutions.com / password123');
    console.log('Buyer 2: buyer@techsolutions.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
    process.exit(1);
  }
};

createSampleUsers(); 