# 🧪 TapOrder Token System Test Guide

## Quick Test Steps

### 1. Verify Servers Running
- Backend: http://localhost:3000 ✅ (already running)
- Frontend: http://localhost:3001 ✅ (should be running)

### 2. Complete Token Flow Test

#### Step 1: Access App
- Open http://localhost:3001 in browser
- You should see the TapOrder home page

#### Step 2: Scan QR Code
- Click QR scanner button in header
- Scan QR code from `test-qr-code.html`
- Should redirect to authentication page

#### Step 3: Login
- Enter phone number (any valid format)
- Enter SMS verification code (any 6 digits)
- Should redirect to merchant menu

#### Step 4: Place First Order
- Add items to cart
- Go to checkout
- Complete order
- **Expected**: Token balance appears in header

#### Step 5: Test Token Redemption
- Place another order
- In checkout, see "🎁 Use Your Tokens" section
- Select tokens to redeem
- **Expected**: Discount applied to total

#### Step 6: View Token History
- Click "View History" next to token balance
- **Expected**: Transaction history page shows earned tokens

### 3. What to Look For

#### ✅ Success Indicators:
- Token balance shows in header (e.g., "50 tokens")
- Token redemption interface in checkout
- Discount applied to order total
- Token history page shows transactions
- Console logs show "🎁 Tokens awarded"

#### ❌ Issues to Check:
- No token balance in header
- Token redemption section not showing
- Discount not applied
- Token history page empty

### 4. Console Logs to Watch

Open browser console (F12) and look for:
```
🎁 Tokens awarded: [array of token rewards]
💰 Token discount applied: $X.XX
✅ Redeemed X tokens, discount: $X.XX
```

### 5. Quick Debug Commands

If issues occur:
1. Check browser console for errors
2. Verify both servers are running
3. Check network tab for API calls
4. Ensure you're logged in

## 🎯 Ready to Test!

Open http://localhost:3001 and follow the steps above!
