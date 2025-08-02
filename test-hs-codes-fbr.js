const mongoose = require('mongoose');
const FbrInvoice = require('./models/fbrInvoice');

// Test function to check HS Codes in FBR submissions
async function testHSCodesInFBR() {
  try {
    console.log('🧪 Testing HS Codes in FBR Submissions...\n');

    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/tax-consultancy', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get all FBR submissions
    const submissions = await FbrInvoice.find().sort({ createdAt: -1 }).limit(5);

    console.log(`📋 Found ${submissions.length} FBR submissions\n`);

    submissions.forEach((submission, index) => {
      console.log(`=== Submission ${index + 1} ===`);
      console.log(`Invoice Number: ${submission.invoiceNumber}`);
      console.log(`Status: ${submission.status}`);
      console.log(`Items Count: ${submission.items?.length || 0}`);
      
      if (submission.items && submission.items.length > 0) {
        console.log('Items with HS Codes:');
        submission.items.forEach((item, itemIndex) => {
          console.log(`  Item ${itemIndex + 1}:`);
          console.log(`    Description: ${item.description || 'N/A'}`);
          console.log(`    HS Code: ${item.hsCode || '0000.00.00'}`);
          console.log(`    Quantity: ${item.quantity || 0}`);
          console.log(`    Unit Price: ${item.unitPrice || 0}`);
        });
      } else {
        console.log('❌ No items found in this submission');
      }
      
      console.log('');
    });

    // Test the transformation logic
    console.log('🔄 Testing transformation logic...\n');
    
    const testSubmission = submissions[0];
    if (testSubmission) {
      const hsCodes = testSubmission.items && testSubmission.items.length > 0 
        ? testSubmission.items.map(item => item.hsCode || '0000.00.00').join(', ')
        : '0000.00.00';

      const itemsDescription = testSubmission.items && testSubmission.items.length > 0
        ? testSubmission.items.map(item => item.description || 'Item').join(', ')
        : 'N/A';

      console.log('Transformed Data:');
      console.log(`HS Codes: ${hsCodes}`);
      console.log(`Items Description: ${itemsDescription}`);
    }

    console.log('\n✅ HS Code test completed!');

  } catch (error) {
    console.error('❌ Error testing HS Codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testHSCodesInFBR(); 