// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Types
export interface User {
  id: string;
  phone_number: string;
  token_balance: number;
  created_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  qr_code_url: string;
  new_user_reward: number;
  token_ratio: number;
  distributor_percent: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  merchant: {
    id: string;
    name: string;
  };
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  merchant_id: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface MenuResponse {
  message: string;
  merchant: Merchant;
  products: Product[];
  total_products: number;
}

// Merchant Dashboard Types
export interface MerchantOrder {
  id: string;
  status: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    phone_number: string;
  };
  items: MerchantOrderItem[];
}

export interface MerchantOrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface MerchantSettings {
  name: string;
  qr_code_url: string;
  token_ratio: number;
  new_user_reward: number;
  distributor_percent: number;
  is_active: boolean;
}

export interface MerchantAnalytics {
  period_days: number;
  order_stats: {
    total_orders: number;
    total_revenue: number;
    total_discounts: number;
    avg_order_value: number;
    paid_orders: number;
    pending_orders: number;
    completed_orders: number;
  };
  popular_products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    total_quantity: number;
    order_count: number;
    total_revenue: number;
  }>;
  daily_trends: Array<{
    date: string;
    order_count: number;
    daily_revenue: number;
  }>;
  customer_stats: {
    unique_customers: number;
    new_customers: number;
  };
}