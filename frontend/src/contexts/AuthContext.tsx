'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/lib/types';
import { tokenAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = Cookies.get('auth_token');
    const savedUser = Cookies.get('user_data');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    Cookies.set('auth_token', newToken, { expires: 7 }); // 7 days
    Cookies.set('user_data', JSON.stringify(newUser), { expires: 7 });
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    Cookies.set('user_data', JSON.stringify(updatedUser), { expires: 7 });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    Cookies.remove('auth_token');
    Cookies.remove('user_data');
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const balanceData = await tokenAPI.getBalance();
      // Get the total balance from all token types
      const totalBalance = balanceData.balances.reduce((sum, b) => sum + b.balance, 0);
      const updatedUser = { ...user, token_balance: totalBalance };
      updateUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
