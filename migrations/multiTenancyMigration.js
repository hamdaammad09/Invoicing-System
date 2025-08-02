const mongoose = require('mongoose');
const User = require('../models/user');
const Client = require('../models/client');
const Invoice = require('../models/invoice');
const FbrInvoice = require('../models/fbrInvoice');
const Service = require('../models/service');
const SellerSettings = require('../models/sellerSettings');

/**
 * Multi-tenancy Migration Script
 * This script updates existing data to support multi-tenancy
 */
async function migrateToMultiTenancy() {
  try {
    console.log('🚀 Starting Multi-tenancy Migration...\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/tax-consultancy', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create default seller settings if none exist
    console.log('📋 Step 1: Setting up default seller settings...');
    
    let defaultSeller = await SellerSettings.findOne();
    
    if (!defaultSeller) {
      console.log('📝 Creating default seller settings...');
      defaultSeller = new SellerSettings({
        companyName: 'Default Tax Consultancy',
        name: 'Default Seller',
        sellerNTN: '0000000-0',
        sellerSTRN: '00-00-0000',
        address: 'Default Address',
        phone: '+92-000-0000000',
        email: 'default@taxconsultancy.com',
        status: 'active'
      });
      await defaultSeller.save();
      console.log('✅ Default seller settings created:', defaultSeller._id);
    } else {
      console.log('✅ Found existing seller settings:', defaultSeller._id);
    }

    // Step 2: Update users to have proper roles and sellerId
    console.log('\n📋 Step 2: Updating users for multi-tenancy...');
    
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to update`);
    
    for (const user of users) {
      let updated = false;
      
      // Update role if needed
      if (!user.role || user.role === 'client') {
        user.role = 'buyer';
        updated = true;
      }
      
      // Add sellerId if missing
      if (!user.sellerId) {
        user.sellerId = defaultSeller._id;
        updated = true;
      }
      
      // Add status if missing
      if (!user.status) {
        user.status = 'active';
        updated = true;
      }
      
      if (updated) {
        await user.save();
        console.log(`✅ Updated user: ${user.email} (${user.role})`);
      }
    }

    // Step 3: Update clients to have sellerId
    console.log('\n📋 Step 3: Updating clients for multi-tenancy...');
    
    const clients = await Client.find({ sellerId: { $exists: false } });
    console.log(`📊 Found ${clients.length} clients without sellerId`);
    
    for (const client of clients) {
      client.sellerId = defaultSeller._id;
      client.status = client.status || 'active';
      client.createdBy = client.createdBy || defaultSeller._id;
      await client.save();
      console.log(`✅ Updated client: ${client.companyName}`);
    }

    // Step 4: Update invoices to have sellerId
    console.log('\n📋 Step 4: Updating invoices for multi-tenancy...');
    
    const invoices = await Invoice.find({ sellerId: { $exists: false } });
    console.log(`📊 Found ${invoices.length} invoices without sellerId`);
    
    for (const invoice of invoices) {
      invoice.sellerId = defaultSeller._id;
      invoice.createdBy = invoice.createdBy || defaultSeller._id;
      await invoice.save();
      console.log(`✅ Updated invoice: ${invoice.invoiceNumber}`);
    }

    // Step 5: Update FBR invoices to have sellerId
    console.log('\n📋 Step 5: Updating FBR invoices for multi-tenancy...');
    
    const fbrInvoices = await FbrInvoice.find({ sellerId: { $exists: false } });
    console.log(`📊 Found ${fbrInvoices.length} FBR invoices without sellerId`);
    
    for (const fbrInvoice of fbrInvoices) {
      fbrInvoice.sellerId = defaultSeller._id;
      fbrInvoice.createdBy = fbrInvoice.createdBy || defaultSeller._id;
      await fbrInvoice.save();
      console.log(`✅ Updated FBR invoice: ${fbrInvoice.invoiceNumber}`);
    }

    // Step 6: Update services to have sellerId
    console.log('\n📋 Step 6: Updating services for multi-tenancy...');
    
    const services = await Service.find({ sellerId: { $exists: false } });
    console.log(`📊 Found ${services.length} services without sellerId`);
    
    for (const service of services) {
      service.sellerId = defaultSeller._id;
      service.createdBy = service.createdBy || defaultSeller._id;
      await service.save();
      console.log(`✅ Updated service: ${service.name}`);
    }

    // Step 7: Create indexes for performance
    console.log('\n📋 Step 7: Creating database indexes...');
    
    try {
      // Create indexes for Client model
      const clientIndexes = [
        { key: { sellerId: 1, companyName: 1 }, name: 'sellerId_1_companyName_1' },
        { key: { sellerId: 1, status: 1 }, name: 'sellerId_1_status_1' },
        { key: { sellerId: 1, buyerNTN: 1 }, name: 'sellerId_1_buyerNTN_1', unique: true }
      ];
      
      for (const indexSpec of clientIndexes) {
        try {
          await Client.collection.createIndex(indexSpec.key, { 
            name: indexSpec.name,
            unique: indexSpec.unique || false 
          });
          console.log(`✅ Created Client index: ${indexSpec.name}`);
        } catch (error) {
          if (error.code === 86) { // Index already exists
            console.log(`ℹ️ Client index already exists: ${indexSpec.name}`);
          } else {
            console.log(`⚠️ Failed to create Client index ${indexSpec.name}:`, error.message);
          }
        }
      }
      
      // Create indexes for Invoice model
      const invoiceIndexes = [
        { key: { sellerId: 1, invoiceNumber: 1 }, name: 'sellerId_1_invoiceNumber_1' },
        { key: { sellerId: 1, buyerId: 1 }, name: 'sellerId_1_buyerId_1' },
        { key: { sellerId: 1, status: 1 }, name: 'sellerId_1_status_1' },
        { key: { sellerId: 1, issuedDate: -1 }, name: 'sellerId_1_issuedDate_-1' }
      ];
      
      for (const indexSpec of invoiceIndexes) {
        try {
          await Invoice.collection.createIndex(indexSpec.key, { name: indexSpec.name });
          console.log(`✅ Created Invoice index: ${indexSpec.name}`);
        } catch (error) {
          if (error.code === 86) { // Index already exists
            console.log(`ℹ️ Invoice index already exists: ${indexSpec.name}`);
          } else {
            console.log(`⚠️ Failed to create Invoice index ${indexSpec.name}:`, error.message);
          }
        }
      }
      
      // Create indexes for FbrInvoice model
      const fbrInvoiceIndexes = [
        { key: { sellerId: 1, invoiceNumber: 1 }, name: 'sellerId_1_invoiceNumber_1' },
        { key: { sellerId: 1, status: 1 }, name: 'sellerId_1_status_1' },
        { key: { sellerId: 1, fbrEnvironment: 1 }, name: 'sellerId_1_fbrEnvironment_1' }
      ];
      
      for (const indexSpec of fbrInvoiceIndexes) {
        try {
          await FbrInvoice.collection.createIndex(indexSpec.key, { name: indexSpec.name });
          console.log(`✅ Created FbrInvoice index: ${indexSpec.name}`);
        } catch (error) {
          if (error.code === 86) { // Index already exists
            console.log(`ℹ️ FbrInvoice index already exists: ${indexSpec.name}`);
          } else {
            console.log(`⚠️ Failed to create FbrInvoice index ${indexSpec.name}:`, error.message);
          }
        }
      }
      
      // Create indexes for Service model
      const serviceIndexes = [
        { key: { sellerId: 1, name: 1 }, name: 'sellerId_1_name_1' },
        { key: { sellerId: 1, status: 1 }, name: 'sellerId_1_status_1' },
        { key: { sellerId: 1, category: 1 }, name: 'sellerId_1_category_1' }
      ];
      
      for (const indexSpec of serviceIndexes) {
        try {
          await Service.collection.createIndex(indexSpec.key, { name: indexSpec.name });
          console.log(`✅ Created Service index: ${indexSpec.name}`);
        } catch (error) {
          if (error.code === 86) { // Index already exists
            console.log(`ℹ️ Service index already exists: ${indexSpec.name}`);
          } else {
            console.log(`⚠️ Failed to create Service index ${indexSpec.name}:`, error.message);
          }
        }
      }
      
      // Create indexes for User model
      const userIndexes = [
        { key: { sellerId: 1, role: 1 }, name: 'sellerId_1_role_1' },
        { key: { email: 1 }, name: 'email_1' }
      ];
      
      for (const indexSpec of userIndexes) {
        try {
          await User.collection.createIndex(indexSpec.key, { name: indexSpec.name });
          console.log(`✅ Created User index: ${indexSpec.name}`);
        } catch (error) {
          if (error.code === 86) { // Index already exists
            console.log(`ℹ️ User index already exists: ${indexSpec.name}`);
          } else {
            console.log(`⚠️ Failed to create User index ${indexSpec.name}:`, error.message);
          }
        }
      }
      
      console.log('✅ Database indexes created/verified successfully');
    } catch (error) {
      console.log('⚠️ Some indexes may already exist, continuing...');
    }

    // Step 8: Generate migration report
    console.log('\n📋 Step 8: Generating migration report...');
    
    const report = {
      defaultSellerId: defaultSeller._id,
      totalUsers: await User.countDocuments(),
      totalClients: await Client.countDocuments(),
      totalInvoices: await Invoice.countDocuments(),
      totalFbrInvoices: await FbrInvoice.countDocuments(),
      totalServices: await Service.countDocuments(),
      migrationDate: new Date()
    };
    
    console.log('\n📊 Migration Report:');
    console.log(JSON.stringify(report, null, 2));

    console.log('\n🎉 Multi-tenancy migration completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update your application to use the multi-tenancy middleware');
    console.log('2. Test the seller isolation functionality');
    console.log('3. Create additional seller accounts as needed');
    console.log('4. Update frontend to handle seller-specific data');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToMultiTenancy()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToMultiTenancy }; 