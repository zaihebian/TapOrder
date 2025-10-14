'use client';

import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to TapOrder!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Scan a restaurant's QR code to start ordering
          </p>
          
          <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              How it works:
            </h2>
            <ol className="text-left text-blue-800 space-y-2">
              <li>1. Tap the QR scanner button in the header</li>
              <li>2. Point your camera at the restaurant's QR code</li>
              <li>3. Login with your phone number</li>
              <li>4. Browse the menu and add items to your cart</li>
              <li>5. Checkout and pay securely</li>
            </ol>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to TapOrder!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Scan a restaurant's QR code to start ordering
        </p>
        
        <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            How it works:
          </h2>
          <ol className="text-left text-blue-800 space-y-2">
            <li>1. Tap the QR scanner button in the header</li>
            <li>2. Point your camera at the restaurant's QR code</li>
            <li>3. Browse the menu and add items to your cart</li>
            <li>4. Checkout and pay securely</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
}