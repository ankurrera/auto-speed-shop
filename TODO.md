# Remove Shipping from Invoice - Task Breakdown

## Status: Completed

### 1. Update AdminInvoiceManagement.tsx
- [x] Remove shipping_amount from newTotal calculation in handleCreateInvoice function
- [x] Remove shipping display from invoice preview dialog

### 2. Update InvoiceDisplay.tsx
- [x] Remove shipping row from totals table in main display
- [x] Remove shipping from PDF generation HTML

### 3. Update OrderDetails.tsx
- [x] Remove shipping from "Simple Invoice Summary" section

### 4. Testing & Verification
- [ ] Test invoice creation process
- [ ] Verify invoice totals exclude shipping
- [ ] Check PDF generation works correctly
- [ ] Ensure no broken references to shipping in invoices
