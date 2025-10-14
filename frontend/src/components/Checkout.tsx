'use client';

import { useState } from 'react';
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderAPI } from '@/lib/api';
import TokenRedemption from './TokenRedemption';
import PaymentForm from './PaymentForm';
import StripeProvider from './StripeProvider';

interface CheckoutProps {
  merchantId: string;
  merchantName: string;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

export default function Checkout({ merchantId, merchantName, onBack, onSuccess }: CheckoutProps) {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [tokenRedemptions, setTokenRedemptions] = useState<Array<{tokenTypeId: string, amount: number}>>([]);
  const [tokenDiscount, setTokenDiscount] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setError('');

    try {
      // Create order first
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const orderResponse = await orderAPI.createOrder(merchantId, orderItems, tokenRedemptions);
      setCreatedOrder(orderResponse.order);
      
      // Show payment form
      setShowPaymentForm(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    if (!createdOrder) return;

    try {
      // Process payment with the created order
      const paymentResponse = await orderAPI.payOrder(createdOrder.id, paymentIntent.payment_method);
      
      // Refresh user data to update token balance
      await refreshUser();
      
      clearCart();
      onSuccess(createdOrder.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment processing failed');
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
      </div>

      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-medium">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>${getTotalPrice().toFixed(2)}</span>
            </div>
            {tokenDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Token Discount:</span>
                <span>-${tokenDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total:</span>
              <span className="text-blue-600">${(getTotalPrice() - tokenDiscount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Customer Info</h2>
          <div className="text-sm text-gray-600">
            <p><strong>Phone:</strong> {user?.phone_number}</p>
            <p><strong>Restaurant:</strong> {merchantName}</p>
          </div>
        </div>

        {/* Token Redemption */}
        <TokenRedemption
          merchantId={merchantId}
          totalAmount={getTotalPrice()}
          onRedemptionChange={(redemptions, discount) => {
            setTokenRedemptions(redemptions);
            setTokenDiscount(discount);
          }}
        />

        {/* Order Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special requests or dietary restrictions..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />
        </div>

        {/* Payment Section */}
        {!showPaymentForm ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CreditCardIcon className="h-5 w-5" />
              <span>Payment will be processed securely</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click "Place Order" to proceed to secure payment
            </p>
          </div>
        ) : (
          <StripeProvider>
            <PaymentForm
              amount={getTotalPrice() - tokenDiscount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              disabled={isProcessing}
            />
          </StripeProvider>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Checkout Button */}
        {!showPaymentForm && (
          <button
            onClick={handleCheckout}
            disabled={isProcessing || items.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Order...
              </div>
            ) : (
              `Place Order - $${(getTotalPrice() - tokenDiscount).toFixed(2)}`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
