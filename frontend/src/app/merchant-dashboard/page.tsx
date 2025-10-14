'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ShoppingBagIcon, 
  CogIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { merchantAPI } from '@/lib/api';
import { MerchantOrder, MerchantSettings, MerchantAnalytics, Product } from '@/lib/types';
import ProtectedMerchantRoute from '@/components/ProtectedMerchantRoute';

type TabType = 'analytics' | 'orders' | 'products' | 'settings';

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [analytics, setAnalytics] = useState<MerchantAnalytics | null>(null);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load data based on active tab
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    setError('');
    
    try {
      switch (activeTab) {
        case 'analytics':
          const analyticsData = await merchantAPI.analytics.get(30);
          setAnalytics(analyticsData.analytics);
          break;
        case 'orders':
          const ordersData = await merchantAPI.orders.getAll({ limit: 50 });
          setOrders(ordersData.orders);
          break;
        case 'products':
          const productsData = await merchantAPI.products.getAll();
          setProducts(productsData.products);
          break;
        case 'settings':
          const settingsData = await merchantAPI.settings.get();
          setSettings(settingsData.settings);
          break;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await merchantAPI.orders.updateStatus(orderId, newStatus);
      // Reload orders
      const ordersData = await merchantAPI.orders.getAll({ limit: 50 });
      setOrders(ordersData.orders);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update order status');
    }
  };

  const tabs = [
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'products', name: 'Products', icon: PlusIcon },
    { id: 'settings', name: 'Settings', icon: CogIcon },
  ];

  return (
    <ProtectedMerchantRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your restaurant operations</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'analytics' && (
                  <AnalyticsTab analytics={analytics} />
                )}
                {activeTab === 'orders' && (
                  <OrdersTab 
                    orders={orders} 
                    onStatusUpdate={handleOrderStatusUpdate}
                  />
                )}
                {activeTab === 'products' && (
                  <ProductsTab 
                    products={products} 
                    onProductsChange={loadTabData}
                  />
                )}
                {activeTab === 'settings' && (
                  <SettingsTab 
                    settings={settings} 
                    onSettingsChange={loadTabData}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedMerchantRoute>
  );
}

// Analytics Tab Component
function AnalyticsTab({ analytics }: { analytics: MerchantAnalytics | null }) {
  if (!analytics) return <div className="p-8 text-center text-gray-500">No analytics data available</div>;

  const { order_stats, popular_products, customer_stats } = analytics;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Analytics Overview (Last 30 Days)</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Orders</h3>
          <p className="text-2xl font-bold text-blue-900">{order_stats.total_orders}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">${order_stats.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-600">Avg Order Value</h3>
          <p className="text-2xl font-bold text-purple-900">${order_stats.avg_order_value.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-orange-600">Unique Customers</h3>
          <p className="text-2xl font-bold text-orange-900">{customer_stats.unique_customers}</p>
        </div>
      </div>

      {/* Popular Products */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Popular Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {popular_products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img className="h-10 w-10 rounded-full" src={product.image_url} alt={product.name} />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">${product.price.toFixed(2)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.total_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.order_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.total_revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ 
  orders, 
  onStatusUpdate 
}: { 
  orders: MerchantOrder[]; 
  onStatusUpdate: (orderId: string, status: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'paid': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No orders found</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                  <p className="text-sm text-gray-600">Customer: {order.customer.phone_number}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-lg font-semibold mt-1">${order.final_amount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mb-3">
                <h4 className="font-medium mb-2">Items:</h4>
                <ul className="space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id} className="text-sm text-gray-600">
                      {item.product.name} x {item.quantity} - ${item.subtotal.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              
              {getNextStatus(order.status) && (
                <button
                  onClick={() => onStatusUpdate(order.id, getNextStatus(order.status)!)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  Mark as {getNextStatus(order.status)?.charAt(0).toUpperCase() + getNextStatus(order.status)?.slice(1)}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Products Tab Component
function ProductsTab({ 
  products, 
  onProductsChange 
}: { 
  products: Product[]; 
  onProductsChange: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await merchantAPI.products.update(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          image_url: formData.image_url
        });
      } else {
        await merchantAPI.products.create({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          image_url: formData.image_url
        });
      }
      
      setFormData({ name: '', description: '', price: '', image_url: '' });
      setShowAddForm(false);
      setEditingProduct(null);
      onProductsChange();
    } catch (err: any) {
      console.error('Failed to save product:', err);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await merchantAPI.products.delete(productId);
        onProductsChange();
      } catch (err: any) {
        console.error('Failed to delete product:', err);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Products</h2>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingProduct(null);
            setFormData({ name: '', description: '', price: '', image_url: '' });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                required
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingProduct(null);
                  setFormData({ name: '', description: '', price: '', image_url: '' });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No products found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-32 object-cover rounded-md mb-3"
              />
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              <p className="text-lg font-bold text-blue-600 mb-3">${product.price.toFixed(2)}</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm flex items-center justify-center space-x-1"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm flex items-center justify-center space-x-1"
                >
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ 
  settings, 
  onSettingsChange 
}: { 
  settings: MerchantSettings | null; 
  onSettingsChange: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    token_ratio: '',
    new_user_reward: '',
    qr_code_url: '',
    distributor_percent: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name,
        token_ratio: settings.token_ratio.toString(),
        new_user_reward: settings.new_user_reward.toString(),
        qr_code_url: settings.qr_code_url,
        distributor_percent: settings.distributor_percent.toString()
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await merchantAPI.settings.update({
        name: formData.name,
        token_ratio: parseFloat(formData.token_ratio),
        new_user_reward: parseFloat(formData.new_user_reward),
        qr_code_url: formData.qr_code_url,
        distributor_percent: parseFloat(formData.distributor_percent)
      });
      
      onSettingsChange();
    } catch (err: any) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Merchant Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QR Code URL</label>
            <input
              type="url"
              required
              value={formData.qr_code_url}
              onChange={(e) => setFormData({ ...formData, qr_code_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token Ratio</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.token_ratio}
              onChange={(e) => setFormData({ ...formData, token_ratio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tokens earned per dollar spent</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New User Reward</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.new_user_reward}
              onChange={(e) => setFormData({ ...formData, new_user_reward: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Tokens given to new customers</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Percent</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              value={formData.distributor_percent}
              onChange={(e) => setFormData({ ...formData, distributor_percent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Percentage for distributor (0-100)</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}