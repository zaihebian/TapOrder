'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { orderAPI } from '@/lib/api';
import { Order } from '@/lib/types';

interface OrderConfirmationProps {
  orderId: string;
  onNewOrder: () => void;
}

export default function OrderConfirmation({ orderId, onNewOrder }: OrderConfirmationProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // In a real app, you'd fetch the order details
    // For MVP, we'll simulate the order data
    setTimeout(() => {
      setOrder({
        id: orderId,
        merchant_id: 'merchant-id',
        status: 'paid',
        total_amount: 25.99,
        discount_amount: 0,
        final_amount: 25.99,
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            product: {
              id: 'product-1',
              name: 'Delicious Pizza',
              description: 'A tasty pizza with cheese and toppings',
              price: 15.99,
              image_url: 'https://example.com/pizza.jpg',
              merchant: { id: 'merchant-id', name: 'Test Restaurant' },
              created_at: new Date().toISOString()
            },
            quantity: 1,
            price: 15.99
          }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">Your order has been placed successfully</p>
      </div>

      <div className="space-y-6">
        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Order Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono">{order.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="capitalize text-green-600 font-medium">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold">${order.final_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Time:</span>
              <span>{new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded-md"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-food.jpg';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <span className="font-semibold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-2">What's Next?</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your order is being prepared</li>
            <li>• You'll receive updates via SMS</li>
            <li>• Pick up your order when ready</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onNewOrder}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          >
            Place Another Order
          </button>
          <button
            onClick={() => window.print()}
            className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 font-semibold"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
