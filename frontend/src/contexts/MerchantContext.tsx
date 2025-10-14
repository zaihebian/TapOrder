'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { merchantAPI } from '@/lib/api';
import { MerchantSettings } from '@/lib/types';

interface Merchant {
  merchantId: string;
  email: string;
  role: string;
}

interface MerchantContextType {
  merchant: Merchant | null;
  settings: MerchantSettings | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export function MerchantProvider({ children }: { children: React.ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = Cookies.get('merchant_token');
    if (token) {
      try {
        // Verify token and get merchant info
        const settingsData = await merchantAPI.settings.get();
        setSettings(settingsData.settings);
        
        // For now, we'll create a mock merchant object
        // In a real app, you'd decode the JWT token to get merchant info
        setMerchant({
          merchantId: 'mock-merchant-id',
          email: 'merchant@example.com',
          role: 'merchant'
        });
      } catch (error) {
        console.error('Token verification failed:', error);
        Cookies.remove('merchant_token');
      }
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      // For MVP, we'll simulate merchant login
      // In production, you'd call a real merchant authentication endpoint
      const mockToken = 'mock-merchant-token-' + Date.now();
      Cookies.set('merchant_token', mockToken, { expires: 7 });
      
      setMerchant({
        merchantId: 'mock-merchant-id',
        email: email,
        role: 'merchant'
      });

      // Set default settings for demo (offline mode)
      setSettings({
        name: 'Demo Restaurant',
        qr_code_url: 'https://example.com/qr',
        token_ratio: 0.01,
        new_user_reward: 10,
        distributor_percent: 5,
        is_active: true
      });

      console.log('Merchant login successful (offline mode)');
    } catch (error) {
      console.error('Merchant login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('merchant_token');
    setMerchant(null);
    setSettings(null);
  };

  const value: MerchantContextType = {
    merchant,
    settings,
    login,
    logout,
    isAuthenticated: !!merchant,
    isLoading
  };

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const context = useContext(MerchantContext);
  if (context === undefined) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
}
