# Custom Order & Payment Flow Fix

## Issue
The custom order and payment flow was failing with the error:
```
Failed to create order: new row for relation "orders" violates check constraint "orders_status_check"
```

## Root Cause
The `orders` table had a check constraint (`orders_status_check`) that only allowed basic status values like 'pending', 'processing', 'completed', etc. However, the custom order flow was trying to use extended status values like 'pending_admin_review', 'invoice_sent', etc.

## Solution
1. **Updated the database constraint** by creating a new migration file:
   - `supabase/migrations/20250110140000_fix_orders_status_constraint.sql`
   - This migration drops the existing constraint and creates a new one that includes all custom order status values
   - Also ensures payment_status constraint includes all required values

2. **Added missing database fields** to support the custom order flow:
   - `convenience_fee` and `delivery_charge` columns
   - Updated `src/database.types.ts` to include these fields

## Custom Order Status Flow
1. **pending_admin_review** - Initial status when customer submits order request
2. **invoice_sent** - Admin has reviewed and sent invoice to customer  
3. **invoice_accepted** - Customer accepts the invoice
4. **invoice_declined** - Customer declines the invoice
5. **payment_pending** - Waiting for customer payment
6. **payment_submitted** - Customer submitted payment proof
7. **payment_verified** - Admin verified the payment
8. **confirmed** - Order is confirmed and ready for fulfillment
9. **shipped** - Order has been shipped
10. **delivered** - Order has been delivered

## Testing
The fix allows the custom order creation to proceed without constraint violations. The CustomCheckout component can now successfully create orders with status 'pending_admin_review'.

## Files Modified
- `supabase/migrations/20250110140000_fix_orders_status_constraint.sql` (new)
- `src/database.types.ts` (updated to include convenience_fee and delivery_charge)