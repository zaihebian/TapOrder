'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { Product, Merchant } from '@/lib/types';
import { menuAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

interface MenuProps {
  merchantId: string;
}

export default function Menu({ merchantId }: MenuProps) {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem, getTotalItems } = useCart();

  useEffect(() => {
    loadMenu();
  }, [merchantId]);

  const loadMenu = async () => {
    try {
      setIsLoading(true);
      const response = await menuAPI.getMenu(merchantId);
      setMerchant(response.merchant);
      setProducts(response.products);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {merchant && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
          <p className="text-gray-600">Browse our delicious menu</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={addItem} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products available</p>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity?: number) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-w-16 aspect-h-9">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-food.jpg';
          }}
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <button
          onClick={handleAddToCart}
          className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
        >
          <ShoppingCartIcon className="h-4 w-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
