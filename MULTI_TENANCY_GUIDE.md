# Multi-Tenancy Implementation Guide

## 🎯 Overview

This document describes the multi-tenancy architecture implemented in the FBR E-Invoicing SaaS application. The system now supports complete data isolation between different sellers (tax consultancies), ensuring that each seller only sees and manages their own buyers, invoices, and data.

## 🏗️ Architecture Changes

### 1. Database Schema Updates

#### User Model (`models/user.js`)
- **Added `sellerId` field**: Links users to their seller organization
- **Updated role system**: 
  - `admin`: Can access all data (no seller isolation)
  - `seller`: Tax consultancy users (can manage their own data)
  - `buyer`: Customer users (belong to a specific seller)
- **Added status tracking**: Account management (active, inactive, suspended)
- **Added permissions**: Seller-specific permissions for data management

#### Client Model (`models/client.js`)
- **Added `sellerId` field**: Ensures buyers belong to specific sellers
- **Enhanced buyer information**: Phone, email, contact person, business type
- **Added status management**: Active, inactive, suspended buyers
- **Added audit trail**: `createdBy` field tracks who added the buyer
- **Unique constraints**: Buyer NTN must be unique within a seller's scope

#### Invoice Model (`models/invoice.js`)
- **Added `sellerId` field**: Ensures invoices belong to specific sellers
- **Enhanced tracking**: FBR submission status, created by user
- **Improved indexing**: Performance optimization for seller-specific queries

#### FBR Invoice Model (`models/fbrInvoice.js`)
- **Added `sellerId` field**: Ensures FBR submissions are seller-isolated
- **Enhanced tracking**: Created by user, submission metadata

#### Service Model (`models/service.js`)
- **Added `sellerId` field**: Ensures services belong to specific sellers
- **Enhanced metadata**: Template services, usage tracking

### 2. Middleware Implementation

#### Multi-Tenancy Middleware (`middleware/multiTenancyMiddleware.js`)
- **`multiTenancyMiddleware`**: Extracts seller context from authenticated user
- **`requireSellerContext`**: Ensures seller context for protected routes
- **`requireAdmin`**: Restricts access to admin users only
- **`requireSeller`**: Restricts access to seller users only
- **`buildSellerQuery`**: Helper to build seller-specific database queries
- **`validateSellerOwnership`**: Validates document ownership within seller scope

### 3. Controller Updates

#### Client Controller (`controllers/clientController.js`)
- **All operations filtered by `sellerId`**
- **Buyer ownership validation**
- **Enhanced error handling for seller isolation**
- **Audit trail for buyer management**

#### Invoice Controller (`controllers/invoiceController.js`)
- **Invoice creation with automatic seller assignment**
- **Buyer validation within seller scope**
- **Enhanced HS Code assignment**
- **Improved error handling**

## 🔐 Security Features

### 1. Data Isolation
- **Complete separation**: Each seller's data is completely isolated
- **No cross-seller access**: Sellers cannot see other sellers' data
- **Buyer validation**: Buyers must belong to the authenticated seller

### 2. Role-Based Access Control
- **Admin**: Full system access (no seller isolation)
- **Seller**: Access only to their own data and buyers
- **Buyer**: Access only to their own invoices and data

### 3. Query Filtering
- **Automatic filtering**: All database queries automatically filter by seller
- **Middleware enforcement**: Seller context enforced at middleware level
- **Ownership validation**: Document access validated against seller ownership

## 🚀 Implementation Steps

### 1. Run Migration
```bash
node migrations/multiTenancyMigration.js
```

This script will:
- Create default seller settings if none exist
- Update existing users with proper roles and sellerId
- Update existing clients, invoices, and services with sellerId
- Create database indexes for performance
- Generate migration report

### 2. Update Application
The multi-tenancy middleware is automatically applied to all `/api` routes in `app.js`.

### 3. Test Seller Isolation
- Create multiple seller accounts
- Verify data isolation between sellers
- Test buyer management within seller scope
- Verify invoice creation and management

## 📊 Database Indexes

### Performance Optimizations
```javascript
// Client indexes
{ sellerId: 1, companyName: 1 }
{ sellerId: 1, status: 1 }
{ sellerId: 1, buyerNTN: 1 } // Unique within seller

// Invoice indexes
{ sellerId: 1, invoiceNumber: 1 }
{ sellerId: 1, buyerId: 1 }
{ sellerId: 1, status: 1 }
{ sellerId: 1, issuedDate: -1 }

// FBR Invoice indexes
{ sellerId: 1, invoiceNumber: 1 }
{ sellerId: 1, status: 1 }
{ sellerId: 1, fbrEnvironment: 1 }

// Service indexes
{ sellerId: 1, name: 1 }
{ sellerId: 1, status: 1 }
{ sellerId: 1, category: 1 }

// User indexes
{ sellerId: 1, role: 1 }
{ email: 1 }
```

## 🔄 API Changes

### 1. Response Format
All API responses now include:
```javascript
{
  success: true/false,
  data: {...}, // or specific field names
  count: number,
  message: "Success/error message"
}
```

### 2. Error Handling
Enhanced error messages for seller isolation:
- "Seller context required for this operation"
- "Selected buyer not found or access denied"
- "Document not found or access denied"

### 3. Authentication Requirements
- All API routes require authentication
- Seller context automatically extracted from user
- Admin users bypass seller isolation

## 🧪 Testing

### 1. Seller Isolation Test
```javascript
// Test that sellers can only see their own data
const seller1Data = await api.get('/api/clients', { 
  headers: { 'Authorization': `Bearer ${seller1Token}` } 
});
const seller2Data = await api.get('/api/clients', { 
  headers: { 'Authorization': `Bearer ${seller2Token}` } 
});

// seller1Data should not contain seller2Data and vice versa
```

### 2. Buyer Management Test
```javascript
// Test that sellers can only manage their own buyers
const buyerData = {
  companyName: 'Test Buyer',
  buyerNTN: '1234567-8',
  buyerSTRN: '12-34-5678901',
  address: 'Test Address'
};

// Should succeed for seller's own buyer
await api.post('/api/clients', buyerData, { 
  headers: { 'Authorization': `Bearer ${sellerToken}` } 
});

// Should fail for buyer from different seller
```

### 3. Invoice Creation Test
```javascript
// Test that invoices are automatically assigned to seller
const invoiceData = {
  buyerId: sellerBuyerId, // Must belong to seller
  items: [...],
  // sellerId automatically assigned by middleware
};

const invoice = await api.post('/api/invoices', invoiceData, {
  headers: { 'Authorization': `Bearer ${sellerToken}` }
});

// invoice.sellerId should match authenticated seller
```

## 🛠️ Maintenance

### 1. Adding New Sellers
```javascript
// Create seller settings
const sellerSettings = new SellerSettings({
  companyName: 'New Tax Consultancy',
  sellerNTN: '1234567-8',
  sellerSTRN: '12-34-5678901',
  address: 'Consultancy Address',
  phone: '+92-300-1234567',
  email: 'info@newconsultancy.com',
  status: 'active'
});

// Create seller user
const sellerUser = new User({
  name: 'Seller Name',
  email: 'seller@newconsultancy.com',
  password: 'hashedPassword',
  role: 'seller',
  sellerId: sellerSettings._id,
  permissions: ['manage_own_buyers', 'view_own_invoices', 'fbr_submission']
});
```

### 2. Adding Buyers to Seller
```javascript
// Buyers are automatically assigned to the authenticated seller
const buyerData = {
  companyName: 'New Buyer',
  buyerNTN: '8765432-1',
  buyerSTRN: '98-76-5432109',
  address: 'Buyer Address',
  phone: '+92-300-9876543',
  email: 'contact@newbuyer.com',
  businessType: 'manufacturing',
  status: 'active'
};

// sellerId automatically added by middleware
const buyer = await api.post('/api/clients', buyerData, {
  headers: { 'Authorization': `Bearer ${sellerToken}` }
});
```

### 3. Data Backup and Recovery
```javascript
// Backup seller-specific data
const sellerData = await Promise.all([
  Client.find({ sellerId: sellerId }),
  Invoice.find({ sellerId: sellerId }),
  FbrInvoice.find({ sellerId: sellerId }),
  Service.find({ sellerId: sellerId })
]);

// Restore seller-specific data
await Promise.all([
  Client.insertMany(sellerData[0]),
  Invoice.insertMany(sellerData[1]),
  FbrInvoice.insertMany(sellerData[2]),
  Service.insertMany(sellerData[3])
]);
```

## 🚨 Important Notes

### 1. Migration Safety
- **Backup your database** before running migration
- **Test in development** environment first
- **Verify data integrity** after migration
- **Monitor performance** with new indexes

### 2. Security Considerations
- **Never expose sellerId** in client-side code
- **Always validate ownership** before operations
- **Use HTTPS** in production
- **Implement rate limiting** for API endpoints

### 3. Performance Considerations
- **Monitor query performance** with new indexes
- **Consider pagination** for large datasets
- **Implement caching** for frequently accessed data
- **Optimize database queries** for seller-specific operations

## 📞 Support

For questions or issues with the multi-tenancy implementation:

1. Check the migration logs for any errors
2. Verify database indexes are created correctly
3. Test seller isolation with multiple accounts
4. Review API response formats for consistency
5. Monitor application performance and logs

## 🔄 Future Enhancements

### 1. Advanced Features
- **Seller-specific configurations**: Custom settings per seller
- **Data export/import**: Seller-specific data management
- **Analytics**: Seller-specific reporting and insights
- **Billing**: Per-seller usage tracking and billing

### 2. Performance Optimizations
- **Database sharding**: Separate databases per seller
- **Caching strategies**: Redis caching for seller data
- **CDN integration**: Static asset delivery optimization
- **Load balancing**: Multi-region deployment

### 3. Security Enhancements
- **API rate limiting**: Per-seller rate limiting
- **Audit logging**: Comprehensive activity tracking
- **Data encryption**: Field-level encryption
- **Access controls**: Granular permission system 