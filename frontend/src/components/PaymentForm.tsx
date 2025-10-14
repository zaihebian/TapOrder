'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CreditCardIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function PaymentForm({ amount, onSuccess, onError, disabled = false }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setPaymentError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setPaymentError(pmError.message || 'Payment method creation failed');
        setIsProcessing(false);
        return;
      }

      // For MVP, we'll simulate successful payment
      // In production, you'd send the payment method to your backend
      console.log('Payment method created:', paymentMethod);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful payment
      const mockPaymentIntent = {
        id: 'pi_mock_' + Date.now(),
        status: 'succeeded',
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethod?.id
      };

      setPaymentSuccess(true);
      onSuccess(mockPaymentIntent);
      
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed');
      onError(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  if (paymentSuccess) {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
        <p className="text-green-600">Your order has been processed successfully.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center mb-6">
        <CreditCardIcon className="h-6 w-6 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Payment Information</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <CardElement
              options={cardElementOptions}
              className="w-full"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</span>
          </div>
        </div>

        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center">
            <XCircleIcon className="h-5 w-5 mr-2" />
            <span className="text-sm">{paymentError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isProcessing || disabled}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Your payment information is secure and encrypted
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Powered by Stripe • Test mode enabled
          </p>
        </div>
      </form>
    </div>
  );
}
