'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMerchant } from '@/contexts/MerchantContext';

interface ProtectedMerchantRouteProps {
  children: React.ReactNode;
}

export default function ProtectedMerchantRoute({ children }: ProtectedMerchantRouteProps) {
  const { isAuthenticated, isLoading } = useMerchant();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/merchant-login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
