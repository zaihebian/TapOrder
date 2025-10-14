'use client';

import { useState } from 'react';
import { ShoppingCartIcon, QrCodeIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Cart from '@/components/Cart';
import QRScanner from '@/components/QRScanner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const handleQRScan = (merchantId: string) => {
    setIsQRScannerOpen(false);
    // Navigate to menu page with merchant ID
    window.location.href = `/menu/${merchantId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-blue-600">TapOrder</h1>
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UserIcon className="h-4 w-4" />
                  <span>{user.phone_number}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                title="Scan QR Code"
              >
                <QrCodeIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Shopping Cart"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>

              {user && (
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Modals */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          // Navigate to checkout
          window.location.href = '/checkout';
        }}
      />

      <QRScanner
        onScan={handleQRScan}
        onClose={() => setIsQRScannerOpen(false)}
      />
    </div>
  );
}
