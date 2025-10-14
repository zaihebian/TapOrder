'use client';

import { useState } from 'react';
import { ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderAPI } from '@/lib/api';

interface CheckoutProps {
  merchantId: string;
  merchantName: string;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

export default function Checkout({ merchantId, merchantName, onBack, onSuccess }: CheckoutProps) {
  const { items, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsProcessing(true);
    setError('');

    try {
      // Create order
      const orderItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const orderResponse = await orderAPI.createOrder(merchantId, orderItems);
      const orderId = orderResponse.order.id;

      // For MVP, we'll simulate payment success
      // In production, you'd integrate with Stripe Elements here
      const paymentResponse = await orderAPI.payOrder(orderId, 'pm_test_payment_method');
      
      clearCart();
      onSuccess(orderId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process order');
    } finally {
      setIsProcessing(false);
    }
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
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-blue-600">${getTotalPrice().toFixed(2)}</span>
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

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CreditCardIcon className="h-5 w-5" />
            <span>Payment will be processed securely</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            For MVP demo, payment is simulated. In production, Stripe Elements would be integrated here.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={isProcessing || items.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Order...
            </div>
          ) : (
            `Place Order - $${getTotalPrice().toFixed(2)}`
          )}
        </button>
      </div>
    </div>
  );
}
