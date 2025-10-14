'use client';

import React, { useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface TokenType {
  tokenTypeId: string;
  tokenType: {
    id: string;
    name: string;
    symbol: string;
    description: string;
  };
  availableAmount: number;
  transactions: any[];
}

interface TokenRedemptionProps {
  merchantId: string;
  totalAmount: number;
  onRedemptionChange: (redemptions: Array<{tokenTypeId: string, amount: number}>, discount: number) => void;
}

const TokenRedemption = ({ merchantId, totalAmount, onRedemptionChange }: TokenRedemptionProps) => {
  const [availableTokens, setAvailableTokens] = useState<TokenType[]>([]);
  const [redemptions, setRedemptions] = useState<Array<{tokenTypeId: string, amount: number}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableTokens();
  }, [merchantId]);

  const fetchAvailableTokens = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tokens/available?merchantId=${merchantId}`);
      setAvailableTokens(response.data.tokens);
    } catch (err: any) {
      console.error('Failed to fetch available tokens:', err);
      setError('Failed to load available tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenRedemption = (tokenTypeId: string, amount: number) => {
    const newRedemptions = [...redemptions];
    const existingIndex = newRedemptions.findIndex(r => r.tokenTypeId === tokenTypeId);
    
    if (existingIndex >= 0) {
      if (amount === 0) {
        newRedemptions.splice(existingIndex, 1);
      } else {
        newRedemptions[existingIndex].amount = amount;
      }
    } else if (amount > 0) {
      newRedemptions.push({ tokenTypeId, amount });
    }
    
    setRedemptions(newRedemptions);
    
    // Calculate total discount
    const totalDiscount = newRedemptions.reduce((sum, r) => sum + (r.amount * 0.01), 0);
    onRedemptionChange(newRedemptions, totalDiscount);
  };

  const getMaxRedemption = (tokenType: TokenType) => {
    const maxTokens = Math.min(tokenType.availableAmount, Math.floor(totalAmount * 100));
    return maxTokens;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Token Redemption</h3>
        <p className="text-gray-600">Loading available tokens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Token Redemption</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (availableTokens.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Token Redemption</h3>
        <p className="text-gray-600">No tokens available for redemption</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">🎁 Use Your Tokens</h3>
      <p className="text-blue-700 text-sm mb-4">
        Redeem your tokens for discounts! 1 token = $0.01
      </p>
      
      <div className="space-y-3">
        {availableTokens.map((tokenType) => {
          const currentRedemption = redemptions.find(r => r.tokenTypeId === tokenType.tokenTypeId);
          const currentAmount = currentRedemption?.amount || 0;
          const maxAmount = getMaxRedemption(tokenType);
          
          return (
            <div key={tokenType.tokenTypeId} className="bg-white rounded-lg p-3 border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {tokenType.tokenType.name} ({tokenType.tokenType.symbol})
                  </h4>
                  <p className="text-sm text-gray-600">
                    Available: {tokenType.availableAmount} tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    Max: {maxAmount} tokens
                  </p>
                  {currentAmount > 0 && (
                    <p className="text-sm text-blue-600">
                      Discount: ${(currentAmount * 0.01).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTokenRedemption(tokenType.tokenTypeId, Math.max(0, currentAmount - 10))}
                  disabled={currentAmount <= 0}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -10
                </button>
                
                <input
                  type="number"
                  min="0"
                  max={maxAmount}
                  value={currentAmount}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(maxAmount, parseInt(e.target.value) || 0));
                    handleTokenRedemption(tokenType.tokenTypeId, value);
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                />
                
                <button
                  onClick={() => handleTokenRedemption(tokenType.tokenTypeId, Math.min(maxAmount, currentAmount + 10))}
                  disabled={currentAmount >= maxAmount}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +10
                </button>
                
                <button
                  onClick={() => handleTokenRedemption(tokenType.tokenTypeId, maxAmount)}
                  disabled={currentAmount >= maxAmount}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Max
                </button>
                
                {currentAmount > 0 && (
                  <button
                    onClick={() => handleTokenRedemption(tokenType.tokenTypeId, 0)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {redemptions.length > 0 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-800">
              Total Token Discount: ${redemptions.reduce((sum, r) => sum + (r.amount * 0.01), 0).toFixed(2)}
            </span>
            <span className="text-sm text-green-700">
              Tokens used: {redemptions.reduce((sum, r) => sum + r.amount, 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenRedemption;
