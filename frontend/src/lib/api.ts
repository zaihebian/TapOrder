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
  const merchantToken = Cookies.get('merchant_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (merchantToken) {
    config.headers.Authorization = `Bearer ${merchantToken}`;
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
  createOrder: async (merchant_id: string, items: any[], token_redemptions?: any[]): Promise<{ message: string; order: Order }> => {
    const response = await api.post('/orders', { merchant_id, items, token_redemptions });
    return response.data;
  },

  // Process payment
  payOrder: async (orderId: string, payment_method_id: string): Promise<{ message: string; order: Order }> => {
    const response = await api.post(`/orders/${orderId}/pay`, { payment_method_id });
    return response.data;
  },

  // Get order details
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
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

// Merchant API
export const merchantAPI = {
  // Product management
  products: {
    // Get all products for merchant
    getAll: async () => {
      const response = await api.get('/merchant/products');
      return response.data;
    },

    // Create new product
    create: async (productData: { name: string; description: string; price: number; image_url: string }) => {
      const response = await api.post('/merchant/products', productData);
      return response.data;
    },

    // Update product
    update: async (productId: string, productData: { name: string; description: string; price: number; image_url: string }) => {
      const response = await api.put(`/merchant/products/${productId}`, productData);
      return response.data;
    },

    // Delete product
    delete: async (productId: string) => {
      const response = await api.delete(`/merchant/products/${productId}`);
      return response.data;
    },
  },

  // Order management
  orders: {
    // Get all orders for merchant
    getAll: async (params?: { status?: string; limit?: number; offset?: number }) => {
      const response = await api.get('/orders/merchant/orders', { params });
      return response.data;
    },

    // Update order status
    updateStatus: async (orderId: string, status: string) => {
      const response = await api.put(`/orders/merchant/orders/${orderId}/status`, { status });
      return response.data;
    },
  },

  // Settings management
  settings: {
    // Get merchant settings
    get: async () => {
      const response = await api.get('/merchant/settings');
      return response.data;
    },

    // Update merchant settings
    update: async (settingsData: {
      name?: string;
      token_ratio?: number;
      new_user_reward?: number;
      qr_code_url?: string;
      distributor_percent?: number;
    }) => {
      const response = await api.put('/merchant/settings', settingsData);
      return response.data;
    },
  },

  // Analytics
  analytics: {
    // Get merchant analytics
    get: async (period?: number) => {
      const response = await api.get('/merchant/analytics', { params: { period } });
      return response.data;
    },
  },
};

export default api;
