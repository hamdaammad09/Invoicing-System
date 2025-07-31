# 🏛️ FBR E-Invoicing System - Updated Guide

## 📋 **Overview**

The FBR e-invoicing system has been completely redesigned to use **invoice numbers** instead of client selection, ensuring each invoice is unique and preventing duplicate submissions to FBR.

## 🔄 **Key Changes Made**

### **1. Invoice Number Selection (Instead of Client Selection)**
- **Before**: "Select Client" dropdown
- **After**: "Select Invoice Number" dropdown
- **Benefit**: Each invoice number is unique, preventing duplicate FBR submissions

### **2. Seller Details Integration**
- **Before**: Used buyer details from client management
- **After**: Uses seller details from seller settings
- **Benefit**: Proper seller information for FBR compliance

### **3. Automatic Data Fetching**
- **Before**: Manual data entry
- **After**: Auto-fetches all invoice data when invoice number is selected
- **Benefit**: Faster, error-free FBR submission

### **4. FBR-Compliant Invoice Generation**
- **New Feature**: Generate FBR-compliant PDF invoices
- **Benefit**: Professional invoices that can be sent to clients

## 🚀 **New API Endpoints**

### **Invoice Selection & Data Fetching**
```http
GET /api/fbrinvoices/available-invoices
```
- Returns all invoices not yet submitted to FBR
- Includes invoice number, date, amount, buyer/seller names

```http
GET /api/fbrinvoices/invoice/:invoiceNumber
```
- Fetches complete invoice details by invoice number
- Includes all items with HS codes, buyer/seller details

### **FBR Submission**
```http
POST /api/fbrinvoices/create-from-invoice
```
- Creates and submits FBR invoice from existing invoice
- Body: `{ "invoiceNumber": "INV-123", "sandbox": false }`

### **FBR Invoice Generation**
```http
GET /api/fbrinvoices/generate-pdf/:invoiceNumber
```
- Generates FBR-compliant PDF invoice
- Includes QR code for FBR verification

```http
GET /api/fbrinvoices/data/:invoiceNumber
```
- Returns FBR invoice data for frontend display

### **Management**
```http
GET /api/fbrinvoices/submissions
```
- View all FBR submissions

```http
GET /api/fbrinvoices/pending
```
- View invoices pending FBR submission

```http
POST /api/fbrinvoices/:id/retry
```
- Retry failed FBR submissions

## 📱 **Frontend Integration Guide**

### **1. Updated FBR E-Invoicing Page**

Replace the "Select Client" dropdown with:

```javascript
// Fetch available invoice numbers
const fetchAvailableInvoices = async () => {
  const response = await fetch('/api/fbrinvoices/available-invoices');
  const data = await response.json();
  return data.invoices;
};

// Invoice number dropdown
<select onChange={handleInvoiceNumberChange}>
  <option value="">Select Invoice Number</option>
  {availableInvoices.map(invoice => (
    <option key={invoice.invoiceNumber} value={invoice.invoiceNumber}>
      {invoice.invoiceNumber} - {invoice.buyerName} - Rs. {invoice.totalAmount}
    </option>
  ))}
</select>
```

### **2. Auto-Fetch Invoice Data**

```javascript
const handleInvoiceNumberChange = async (invoiceNumber) => {
  if (!invoiceNumber) return;
  
  const response = await fetch(`/api/fbrinvoices/invoice/${invoiceNumber}`);
  const data = await response.json();
  
  if (data.success) {
    // Auto-populate form fields
    setFormData({
      totalAmount: data.invoice.totalAmount,
      salesTax: data.invoice.salesTax,
      extraTax: data.invoice.extraTax,
      items: data.invoice.items, // Already includes HS codes
      buyerName: data.invoice.buyerName,
      sellerName: data.invoice.sellerName
    });
  }
};
```

### **3. FBR Submission**

```javascript
const submitToFBR = async () => {
  const response = await fetch('/api/fbrinvoices/create-from-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceNumber: selectedInvoiceNumber,
      sandbox: false // or true for testing
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert(`FBR Invoice submitted successfully! Reference: ${result.fbrReference}`);
  }
};
```

### **4. Generate FBR Invoice PDF**

```javascript
const generateFBRInvoice = async (invoiceNumber) => {
  // Open PDF in new window
  window.open(`/api/fbrinvoices/generate-pdf/${invoiceNumber}`, '_blank');
};
```

## 📄 **FBR Invoice Format**

The generated FBR invoice includes:

### **Header Section**
- Company name and address
- NTN #, STRN #, POS ID # (FBR Reference)

### **Invoice Details**
- Invoice number and date
- Buyer details (name, address, phone, STRN, NTN)
- Payment terms

### **Items Table**
- Serial number
- Description
- **HS Code** (auto-assigned)
- Quantity, Rate, Amount
- Discount, Net Amount

### **Summary**
- Gross amount
- Discount
- Total excluding sales tax
- Sales tax (18%)
- Total including sales tax
- Amount in words

### **FBR Integration**
- FBR Invoice number
- QR code for verification
- FBR Pakistan POS system branding

## 🔧 **HS Code Integration**

### **Automatic HS Code Assignment**
- When invoice is created, HS codes are automatically assigned based on item descriptions
- Uses the comprehensive HS code database we created
- Supports poultry products and all business services

### **HS Code Lookup API**
```http
GET /api/hscodes/lookup?description=poultry protein
```
Returns: `{ "hsCode": "2301.10.00", "suggestions": [...] }`

## 🎯 **Workflow Summary**

### **1. Create Invoice**
1. Create invoice in the main system
2. HS codes are automatically assigned
3. Invoice is saved with unique invoice number

### **2. FBR Submission**
1. Go to FBR e-invoicing page
2. Select invoice number from dropdown
3. Invoice data auto-populates
4. Click "Create FBR Invoice"
5. System submits to FBR and gets reference number

### **3. Generate Client Invoice**
1. After successful FBR submission
2. Use "Generate FBR Invoice" button
3. Download FBR-compliant PDF
4. Send to client

## ✅ **Benefits of New System**

1. **Unique Identification**: Invoice numbers are always unique
2. **No Duplicates**: Prevents sending same invoice to FBR multiple times
3. **Auto-Population**: Faster data entry with automatic field population
4. **Seller Compliance**: Uses proper seller details for FBR
5. **Professional Output**: FBR-compliant invoices for clients
6. **HS Code Integration**: Automatic HS code assignment
7. **Error Prevention**: Validates data before FBR submission

## 🚨 **Important Notes**

1. **Invoice Numbers**: Must be unique for each invoice
2. **FBR Reference**: Once submitted, invoice gets FBR reference number
3. **No Re-submission**: Invoices with FBR reference cannot be re-submitted
4. **Seller Settings**: Ensure seller NTN/STRN are configured
5. **HS Codes**: All items must have valid HS codes

## 🔍 **Testing**

### **Test Invoice Creation**
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer_id",
    "sellerId": "seller_id",
    "product": "poultry protein",
    "totalValue": 1000,
    "salesTax": 180
  }'
```

### **Test FBR Submission**
```bash
curl -X POST http://localhost:3000/api/fbrinvoices/create-from-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceNumber": "INV-123",
    "sandbox": true
  }'
```

### **Test PDF Generation**
```bash
curl http://localhost:3000/api/fbrinvoices/generate-pdf/INV-123 \
  --output fbr-invoice.pdf
```

---

**🎉 Your FBR e-invoicing system is now fully automated and compliant!** 