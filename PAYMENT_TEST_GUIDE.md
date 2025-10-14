# Payment Integration Testing Guide

## 🧪 **Quick Test Guide for Phase 4: Payment Frontend**

### **Step 1: Setup Environment**
1. **Create `.env.local`** in the frontend directory:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```

### **Step 2: Test Complete Payment Flow**

#### **Customer Journey:**
1. **Go to main page**: `http://localhost:3000`
2. **Scan QR or go to menu**: `/menu/[merchantId]`
3. **Add items to cart**: Click "Add to Cart" on products
4. **Go to checkout**: Click cart icon → "Checkout"
5. **Review order**: Verify items and total
6. **Apply tokens** (if available): Use token redemption section
7. **Click "Place Order"**: Creates order and shows payment form
8. **Enter payment details**: Use test card `4242 4242 4242 4242`
9. **Complete payment**: Click "Pay $X.XX"
10. **View confirmation**: See detailed receipt and order status

### **Step 3: Test Payment Scenarios**

#### **✅ Successful Payment**
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **Expected**: Payment success → Order confirmation

#### **❌ Declined Payment**
- **Card**: `4000 0000 0000 0002`
- **Expected**: "Your card was declined" error message

#### **❌ Insufficient Funds**
- **Card**: `4000 0000 0000 9995`
- **Expected**: "Your card has insufficient funds" error

#### **❌ Expired Card**
- **Card**: `4000 0000 0000 0069`
- **Expected**: "Your card has expired" error

### **Step 4: Test Order Confirmation**

#### **Receipt Features:**
- [ ] Order number displayed
- [ ] Order status shows "Payment Confirmed"
- [ ] All items listed with quantities and prices
- [ ] Subtotal, discount, and total calculated correctly
- [ ] Restaurant contact information shown
- [ ] Timeline shows payment confirmed
- [ ] Print receipt button works
- [ ] "Place Another Order" button works

### **Step 5: Test Error Handling**

#### **Network Errors:**
1. **Disconnect internet** during payment
2. **Expected**: Graceful error message with retry option

#### **Invalid Card Data:**
1. **Enter invalid card number**: `1234 5678 9012 3456`
2. **Expected**: Real-time validation error

#### **Empty Fields:**
1. **Leave card fields empty**
2. **Expected**: Form validation prevents submission

### **Step 6: Test Mobile Experience**

1. **Open browser dev tools**
2. **Toggle device toolbar**
3. **Select mobile device**
4. **Test payment form on mobile**
5. **Verify responsive design**

### **Step 7: Test Token Integration**

1. **Complete an order first** (to earn tokens)
2. **Place another order**
3. **Apply token discount**
4. **Verify discount applied to total**
5. **Complete payment with discounted amount**

### **Step 8: Merchant Dashboard Integration**

1. **Login to merchant dashboard**: `/merchant-login`
2. **Go to Orders tab**
3. **Verify new orders appear**
4. **Test order status updates**

## 🎯 **Quick 5-Minute Test**

If you want to test quickly:

1. **Add items to cart** → Go to checkout
2. **Click "Place Order"** → Payment form appears
3. **Enter test card**: `4242 4242 4242 4242`
4. **Complete payment** → See confirmation page
5. **Check merchant dashboard** → Order appears in orders list

## 🔧 **Troubleshooting**

### **Payment Form Not Loading**
- Check Stripe publishable key in `.env.local`
- Verify Stripe dependencies installed
- Check browser console for errors

### **Payment Always Fails**
- Ensure using test card numbers
- Check Stripe account is in test mode
- Verify backend is running

### **Order Confirmation Not Showing**
- Check order ID in URL
- Verify order was created successfully
- Check browser console for errors

## 📱 **Test Cards Reference**

| Card Number | Brand | Expected Result |
|-------------|-------|-----------------|
| `4242 4242 4242 4242` | Visa | ✅ Success |
| `5555 5555 5555 4444` | Mastercard | ✅ Success |
| `3782 822463 10005` | Amex | ✅ Success |
| `4000 0000 0000 0002` | Any | ❌ Declined |
| `4000 0000 0000 9995` | Any | ❌ Insufficient funds |
| `4000 0000 0000 0069` | Any | ❌ Expired card |

## ✅ **Success Criteria**

- [ ] Payment form loads correctly
- [ ] Test cards process successfully
- [ ] Error handling works properly
- [ ] Order confirmation displays complete receipt
- [ ] Mobile experience is smooth
- [ ] Token discounts apply correctly
- [ ] Merchant dashboard shows new orders

The payment integration is now complete and ready for testing! 🎉
