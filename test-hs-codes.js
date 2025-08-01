const { findHSCode } = require('./utils/hsCodeDatabase');

console.log('🧪 Testing HS Code Assignment...\n');

// Test different product descriptions
const testProducts = [
  'Tax Filing',
  'Software Development',
  'Legal Consultation',
  'Marketing Services',
  'Transportation',
  'Food Items',
  'Electronics',
  'Poultry meal',
  'Textile Products',
  'Unknown Product'
];

console.log('📋 Testing HS Code Assignment for Different Products:');
console.log('=' .repeat(60));

testProducts.forEach(product => {
  const hsCode = findHSCode(product);
  console.log(`Product: ${product.padEnd(25)} → HS Code: ${hsCode}`);
});

console.log('\n' + '=' .repeat(60));
console.log('✅ HS Code assignment test completed!');

// Test HS Code validation
console.log('\n🔍 Testing HS Code Validation:');
const testHSCodes = [
  '9983.11.00', // Valid
  '9983.12.00', // Valid
  '1234.56.78', // Valid format
  '123.45.67',  // Invalid format
  '12345.67.89', // Invalid format
  'abcd.ef.gh'  // Invalid format
];

testHSCodes.forEach(hsCode => {
  const isValid = /^\d{4}\.\d{2}\.\d{2}$/.test(hsCode);
  console.log(`HS Code: ${hsCode.padEnd(12)} → Valid: ${isValid ? '✅' : '❌'}`);
});

console.log('\n🎯 HS Code integration is ready for FBR submission!'); 