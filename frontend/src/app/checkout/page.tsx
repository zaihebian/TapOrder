'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Checkout from '@/components/Checkout';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantId = searchParams.get('merchantId') || '';
  const merchantName = searchParams.get('merchantName') || 'Restaurant';

  const handleSuccess = (orderId: string) => {
    router.push(`/order-confirmation?orderId=${orderId}&merchantId=${merchantId}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Layout>
      <Checkout
        merchantId={merchantId}
        merchantName={merchantName}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
}
