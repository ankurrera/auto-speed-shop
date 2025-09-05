# Test Plan for ProductManagementContent Fix

## Issue Description
"Your Listed Parts and Products" are not showing the data after page refresh, even though items show correctly after listing them initially.

## Root Cause
The React Query dependencies were incorrectly structured:
- Products/Parts queries depended on local state `sellerId` instead of query result `sellerData?.id`
- On page refresh, local state was reset to null before the seller query completed
- This created a race condition where the products/parts queries wouldn't run

## Fix Applied
1. Updated products query to use `sellerData?.id` instead of `sellerId`
2. Updated parts query to use `sellerData?.id` instead of `sellerId`
3. Updated all `queryClient.invalidateQueries` calls to use the correct query keys with seller ID
4. Maintained backward compatibility by keeping `setSellerId()` for form submissions

## Test Scenarios
1. **Before Fix**: After page refresh, "No items found matching your search" would show
2. **After Fix**: Page refresh should maintain the listed parts and products display

## Key Changes Made
- Query keys now use `['seller-products', sellerData?.id]` and `['seller-parts', sellerData?.id]`
- All mutation invalidations updated to match the new query key structure
- Proper dependency chain: userInfo → sellerData → products/parts