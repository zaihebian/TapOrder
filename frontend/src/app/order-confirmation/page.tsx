'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import OrderConfirmation from '@/components/OrderConfirmation';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || '';
  const merchantId = searchParams.get('merchantId') || '';

  const handleNewOrder = () => {
    if (merchantId) {
      router.push(`/menu/${merchantId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <Layout>
      <OrderConfirmation orderId={orderId} onNewOrder={handleNewOrder} />
    </Layout>
  );
}
