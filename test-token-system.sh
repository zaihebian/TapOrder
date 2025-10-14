#!/bin/bash

echo "🧪 Testing TapOrder Token System"
echo "================================="

# Test 1: Check if servers are running
echo "1. Checking servers..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Backend running on port 3000"
else
    echo "   ❌ Backend not running on port 3000"
fi

if curl -s http://localhost:3001 > /dev/null; then
    echo "   ✅ Frontend running on port 3001"
else
    echo "   ❌ Frontend not running on port 3001"
fi

echo ""
echo "2. Test Steps:"
echo "   📱 Open http://localhost:3001"
echo "   📷 Scan QR code from test-qr-code.html"
echo "   📞 Login with phone number"
echo "   🛒 Add items to cart"
echo "   💳 Checkout and complete order"
echo "   🎁 Check token balance in header"
echo "   📊 View token history"
echo "   🔄 Place another order to test redemption"

echo ""
echo "3. Expected Results:"
echo "   ✅ Token balance shows in header"
echo "   ✅ Token redemption interface in checkout"
echo "   ✅ Discount applied to order total"
echo "   ✅ Token history page shows transactions"
echo "   ✅ Console logs show token rewards"

echo ""
echo "🎯 Ready to test! Open http://localhost:3001"
