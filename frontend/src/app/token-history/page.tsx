'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Layout from '@/components/Layout';
import { ArrowLeftIcon, GiftIcon, CreditCardIcon, ClockIcon } from '@heroicons/react/24/outline';

interface TokenTransaction {
  id: string;
  token_type_id: string;
  amount: number;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'refunded';
  description: string;
  created_at: string;
  expires_at?: string;
  order_id?: string;
  tokenType?: {
    id: string;
    name: string;
    symbol: string;
  };
}

const TokenHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchTokenHistory();
    }
  }, [user]);

  const fetchTokenHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tokens/transactions');
      setTransactions(response.data.transactions);
    } catch (err: any) {
      console.error('Failed to fetch token history:', err);
      setError('Failed to load token history');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return <GiftIcon className="h-5 w-5 text-green-500" />;
      case 'redeemed':
        return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
      case 'expired':
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
      case 'refunded':
        return <ArrowLeftIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <GiftIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return 'text-green-600 bg-green-50';
      case 'redeemed':
        return 'text-blue-600 bg-blue-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      case 'refunded':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading token history...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center text-red-500">
            <p className="text-lg">{error}</p>
            <button
              onClick={fetchTokenHistory}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Token History</h1>
          <p className="text-gray-600">
            Track your token earnings, redemptions, and rewards
          </p>
        </div>

        {/* Token Balance Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Token Balance</h2>
              <p className="text-blue-100">Available for redemption</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{user?.token_balance || 0}</div>
              <div className="text-blue-100">tokens</div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Transaction History</h3>
          </div>
          
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <GiftIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No token transactions yet</p>
              <p className="text-sm">Complete orders to start earning tokens!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getTransactionColor(transaction.transaction_type)}`}>
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {transaction.description}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {transaction.tokenType?.name || transaction.token_type_id} • {formatDate(transaction.created_at)}
                        </p>
                        {transaction.expires_at && (
                          <p className="text-xs text-gray-500">
                            Expires: {formatDate(transaction.expires_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.tokenType?.symbol || 'tokens'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token Value Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Token Value</h4>
          <p className="text-blue-700 text-sm">
            Each token is worth $0.01. You can redeem tokens for discounts on future orders.
            Tokens expire after 1 year from the date they were earned.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default TokenHistory;
