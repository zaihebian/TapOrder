'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

const AuthPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [merchantId, setMerchantId] = useState<string | null>(null);
  
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const merchantIdParam = searchParams.get('merchantId');
    if (merchantIdParam) {
      setMerchantId(merchantIdParam);
    }
  }, [searchParams]);

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/register'; // Both use register to send code
      await api.post(endpoint, { phone_number: phoneNumber });
      setCodeSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', {
        phone_number: phoneNumber,
        verification_code: verificationCode,
      });
      login(response.data.token, response.data.user);
      
      // Redirect to merchant menu after successful login
      if (merchantId) {
        router.push(`/menu/${merchantId}`);
      } else {
        router.push('/'); // Fallback to home if no merchant ID
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {merchantId ? 'Access Restaurant Menu' : 'Login to TapOrder'}
          </h2>
          
          {merchantId && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-blue-800 text-sm">
                📱 Scan QR code detected! Please login to access this restaurant's menu.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={codeSent}
              />
            </div>

            {!codeSent && (
              <button
                onClick={handleSendCode}
                disabled={loading || !phoneNumber}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            )}

            {codeSent && (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <button
                  onClick={handleLogin}
                  disabled={loading || !verificationCode}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Login / Register'}
                </button>
              </div>
            )}


            <div className="text-center mt-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthPage;
