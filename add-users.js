const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const SellerSettings = require('./models/sellerSettings');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tax-consultancy');

async function addUsers() {
  try {
    // Create seller settings
    const seller1 = new SellerSettings({
      companyName: 'HS Softworks',
      sellerSTRN: 'STRN123456',
      sellerNTN: 'NTN123456',
      address: '123 Business Street, Karachi',
      email: 'admin@hssoftworks.com'
    });
    await seller1.save();

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create users
    const admin = new User({
      name: 'HS Softworks Admin',
      email: 'admin@hssoftworks.com',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();

    const seller = new User({
      name: 'HS Softworks Seller',
      email: 'seller@hssoftworks.com',
      password: hashedPassword,
      role: 'seller',
      sellerId: seller1._id
    });
    await seller.save();

    console.log('Users created successfully!');
    console.log('Admin: admin@hssoftworks.com / password123');
    console.log('Seller: seller@hssoftworks.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUsers(); 