import axios from 'axios';
import Cookies from 'js-cookie';
import { API_BASE_URL, AuthResponse, MenuResponse, Order } from './types';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  // Send SMS verification code
  register: async (phone_number: string) => {
    const response = await api.post('/auth/register', { phone_number });
    return response.data;
  },

  // Verify code and login
  login: async (phone_number: string, verification_code: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { phone_number, verification_code });
    return response.data;
  },
};

// Menu API
export const menuAPI = {
  // Get merchant menu
  getMenu: async (merchantId: string): Promise<MenuResponse> => {
    const response = await api.get(`/stores/${merchantId}/menu`);
    return response.data;
  },
};

// Order API
export const orderAPI = {
  // Create order
  createOrder: async (merchant_id: string, items: any[]): Promise<{ message: string; order: Order }> => {
    const response = await api.post('/orders', { merchant_id, items });
    return response.data;
  },

  // Process payment
  payOrder: async (orderId: string, payment_method_id: string): Promise<{ message: string; order: Order }> => {
    const response = await api.post(`/orders/${orderId}/pay`, { payment_method_id });
    return response.data;
  },
};

// Token API
export const tokenAPI = {
  // Get token balance
  getBalance: async () => {
    const response = await api.get('/api/tokens/balance');
    return response.data;
  },

  // Redeem tokens
  redeemTokens: async (order_id: string, token_type_id: string, amount: number) => {
    const response = await api.post('/api/tokens/redeem', { order_id, token_type_id, amount });
    return response.data;
  },
};

export default api;
