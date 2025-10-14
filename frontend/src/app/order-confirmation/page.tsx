'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import OrderConfirmation from '@/components/OrderConfirmation';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') || '';

  const handleNewOrder = () => {
    router.push('/');
  };

  return (
    <Layout>
      <OrderConfirmation orderId={orderId} onNewOrder={handleNewOrder} />
    </Layout>
  );
}
