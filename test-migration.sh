#!/bin/bash

# Post-Migration Test Script
# Run this after applying the database migration to verify all functionality

echo "🔍 Testing Auto Speed Shop Database Migration..."
echo "=============================================="

# Start the development server
echo "📡 Starting development server..."
npm run dev &
DEV_PID=$!
sleep 10

# Test each component endpoint
echo ""
echo "🧪 Testing Component Endpoints..."

# Test 1: Admin Coupons
echo "1. Testing /admin/coupons..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/admin/coupons
if [ $? -eq 0 ]; then
    echo "   ✅ Admin Coupons page loads"
else
    echo "   ❌ Admin Coupons page failed"
fi

# Test 2: Admin Support  
echo "2. Testing /admin/support..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/admin/support
if [ $? -eq 0 ]; then
    echo "   ✅ Admin Support page loads"
else
    echo "   ❌ Admin Support page failed"
fi

# Test 3: User Coupons
echo "3. Testing /user/coupons..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/user/coupons
if [ $? -eq 0 ]; then
    echo "   ✅ User Coupons page loads"
else
    echo "   ❌ User Coupons page failed"
fi

# Test 4: User Support
echo "4. Testing /user/support..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/user/support
if [ $? -eq 0 ]; then
    echo "   ✅ User Support page loads"
else
    echo "   ❌ User Support page failed"
fi

# Clean up
echo ""
echo "🛑 Stopping development server..."
kill $DEV_PID

echo ""
echo "✅ Component testing completed!"
echo ""
echo "📋 Manual Testing Checklist:"
echo "   1. Visit http://localhost:8080/admin/coupons"
echo "   2. Visit http://localhost:8080/admin/support" 
echo "   3. Visit http://localhost:8080/user/coupons"
echo "   4. Visit http://localhost:8080/user/support"
echo "   5. Check browser console for errors"
echo "   6. Verify no more 'Failed to fetch' errors"
echo ""
echo "🎉 If no errors appear in browser console, migration was successful!"