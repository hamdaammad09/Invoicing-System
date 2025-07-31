# Postman Testing Guide for Tax Consultancy Backend

## 🚀 **Quick Start**

### **1. Import the Collection**
1. Download the `Tax_Consultancy_API_Collection.json` file
2. Open Postman
3. Click **Import** → **Upload Files** → Select the JSON file
4. The collection will be imported with all API endpoints

### **2. Set Up Environment Variables**
1. In Postman, go to **Environments** → **Create New Environment**
2. Add these variables:
   ```
   baseUrl: http://localhost:5000
   clientId: (will be filled after creating a client)
   invoiceId: (will be filled after creating an invoice)
   taskId: (will be filled after creating a task)
   serviceId: (will be filled after creating a service)
   ```
3. Save the environment and select it

### **3. Start Your Backend**
```bash
npm start
# or
node server.js
```

## 📋 **Testing Sequence**

### **Phase 1: Health Check & Basic Setup**

#### **1.1 Health Check Tests**
Run these first to ensure your backend is running:

- ✅ **API Health Check** - Should return server status
- ✅ **CORS Test** - Should return CORS configuration
- ✅ **API Routes Test** - Should list all available routes

**Expected Response:**
```json
{
  "message": "✅ API is running...",
  "status": "healthy",
  "database": "connected"
}
```

### **Phase 2: Core Data Management**

#### **2.1 Client Management**
1. **Get All Clients** - Should return empty array initially
2. **Create New Client** - Creates a test client
3. **Get Client by ID** - Copy the returned `_id` to `clientId` variable
4. **Update Client** - Test updating client data
5. **Delete Client** - Test deletion (optional)

**Sample Client Creation:**
```json
{
  "companyName": "Test Company Ltd",
  "buyerSTRN": "1234567890123",
  "buyerNTN": "1234567-8",
  "truckNo": "ABC-123",
  "address": "123 Test Street, Karachi",
  "phone": "+92-300-1234567",
  "email": "test@company.com"
}
```

#### **2.2 Service Management**
1. **Get All Services** - Should return empty array initially
2. **Get Service Statistics** - Should return zero counts
3. **Create New Service** - Creates a tax consultation service
4. **Create Product Service with HS Code** - Tests HS code auto-assignment
5. **Search Services** - Test search functionality
6. **Get Services by Category** - Test filtering
7. **Get Services by Type** - Test filtering
8. **Get Services by Status** - Test filtering
9. **Get Service by ID** - Copy the returned `_id` to `serviceId` variable
10. **Update Service** - Test updating service data
11. **Delete Service** - Test deletion (optional)

**Sample Service Creation:**
```json
{
  "name": "Tax Consultation",
  "type": "Consultation",
  "category": "Tax Consultancy",
  "description": "Professional tax consultation services for businesses",
  "price": 5000,
  "duration": "2 hours",
  "status": "active",
  "isProduct": false
}
```

#### **2.3 Task Management**
1. **Get All Tasks** - Should return empty array initially
2. **Get Task Statistics** - Should return zero counts
3. **Create General Task** - Creates a basic task
4. **Create FBR Task** - Creates an FBR-specific task
5. **Get Tasks by Type** - Test filtering by task type
6. **Get Tasks by Status** - Test filtering by status
7. **Get Tasks by Priority** - Test filtering by priority
8. **Get Task by ID** - Copy the returned `_id` to `taskId` variable
9. **Update Task Status** - Test status updates
10. **Delete Task** - Test deletion (optional)

**Sample Task Creation:**
```json
{
  "title": "FBR Submission for Invoice #123",
  "description": "Submit invoice to FBR for approval and get IRN",
  "dueDate": "2024-01-10",
  "priority": "high",
  "status": "pending",
  "taskType": "fbr_submission",
  "fbrReference": "FBR-2024-001",
  "invoiceNumber": "INV-123"
}
```

### **Phase 3: HS Code Integration**

#### **3.1 HS Code Testing**
1. **Lookup HS Code** - Test HS code lookup by description
2. **Get HS Code Suggestions** - Test suggestions functionality
3. **Validate HS Code** - Test HS code validation
4. **Get All HS Codes** - View all available HS codes
5. **HS Code Auto-complete** - Test auto-complete functionality
6. **Test HS Code Database** - Comprehensive HS code testing

**Test Queries:**
- `tax consultation`
- `poultry`
- `software development`
- `accounting services`

### **Phase 4: Export Functionality**

#### **4.1 Export Testing**
1. **Export to CSV** - Test CSV export with HS codes and FBR data
2. **Export to Excel** - Test Excel export with client and seller details
3. **Export to PDF** - Test PDF export
4. **Test Export** - Test export functionality
5. **Debug Export** - Debug export data structure

### **Phase 5: Invoice Management**

#### **5.1 Invoice Testing**
1. **Get All Invoices** - Should return empty array initially
2. **Get Available Buyers** - Should return created clients
3. **Get Available Sellers** - Should return seller settings
4. **Create Invoice** - Create a test invoice
5. **Get Invoice by ID** - Copy the returned `_id` to `invoiceId` variable
6. **Update Invoice** - Test invoice updates
7. **Delete Invoice** - Test deletion (optional)

**Sample Invoice Creation:**
```json
{
  "buyerId": "{{clientId}}",
  "sellerId": "seller_id_here",
  "invoiceNumber": "INV-001",
  "issuedDate": "2024-01-01",
  "items": [
    {
      "product": "Tax Consultation",
      "units": 1,
      "unitPrice": 5000,
      "totalValue": 5000,
      "salesTax": 750,
      "extraTax": 0,
      "finalValue": 5750,
      "hsCode": "9983.99.00"
    }
  ],
  "status": "pending"
}
```

### **Phase 6: FBR Integration**

#### **6.1 FBR Testing**
1. **Get FBR Invoices** - View FBR invoices
2. **Get Available Invoices for FBR** - View invoices ready for FBR
3. **Get Invoice by Number** - Test invoice retrieval
4. **Create FBR Invoice from Regular Invoice** - Test FBR conversion
5. **Generate PDF for Invoice** - Test PDF generation
6. **Get Invoice Data** - Test data retrieval

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Workflow**
1. Create a client
2. Create a service with HS code
3. Create an invoice with the client and service
4. Create a task for FBR submission
5. Export the data to CSV
6. Update task status to completed

### **Scenario 2: HS Code Integration**
1. Create a service with `isProduct: true`
2. Check if HS code is auto-assigned
3. Test HS code lookup for the service description
4. Validate the assigned HS code

### **Scenario 3: Task Management**
1. Create multiple tasks with different types
2. Test filtering by type, status, and priority
3. Update task statuses
4. Check task statistics

### **Scenario 4: Export Testing**
1. Create sample data (clients, services, invoices)
2. Test CSV export with different options
3. Test Excel export
4. Test PDF export

## 📊 **Expected Results**

### **Successful Responses**
- **200 OK** - GET requests
- **201 Created** - POST requests
- **200 OK** - PUT requests
- **200 OK** - DELETE requests

### **Error Responses**
- **400 Bad Request** - Invalid data
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server errors

### **Sample Success Response**
```json
{
  "message": "Service created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Tax Consultation",
    "type": "Consultation",
    "category": "Tax Consultancy",
    "price": 5000,
    "status": "active"
  }
}
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Connection Refused**
- Ensure backend is running on port 5000
- Check if MongoDB is connected
- Verify environment variables

#### **2. CORS Errors**
- Check CORS configuration in backend
- Ensure proper headers are set

#### **3. Validation Errors**
- Check required fields in request body
- Verify data types (numbers, strings, dates)
- Ensure enum values are correct

#### **4. Database Errors**
- Check MongoDB connection
- Verify database permissions
- Check for duplicate unique fields

### **Debug Steps**
1. Check backend console logs
2. Verify request/response in Postman
3. Test individual endpoints
4. Check database directly
5. Verify environment variables

## 📈 **Performance Testing**

### **Load Testing**
1. Create multiple clients, services, tasks
2. Test bulk operations
3. Monitor response times
4. Check memory usage

### **Data Validation**
1. Test with large datasets
2. Verify data integrity
3. Check relationships between entities
4. Test concurrent operations

## ✅ **Success Criteria**

Your backend is working correctly if:

1. ✅ **All health checks pass**
2. ✅ **CRUD operations work for all entities**
3. ✅ **HS codes are auto-assigned correctly**
4. ✅ **Task filtering works properly**
5. ✅ **Export functions generate files**
6. ✅ **FBR integration responds correctly**
7. ✅ **Statistics endpoints return accurate data**
8. ✅ **Error handling works properly**
9. ✅ **Data validation prevents invalid data**
10. ✅ **All relationships work correctly**

## 🎯 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Optimize performance** if needed
3. **Add more test cases** for edge cases
4. **Document any API changes**
5. **Deploy to production** when ready

## 📞 **Support**

If you encounter issues:
1. Check the backend console logs
2. Verify the API documentation
3. Test individual endpoints
4. Check database connectivity
5. Review error messages carefully

Your backend should now be fully tested and ready for production use! 🚀 