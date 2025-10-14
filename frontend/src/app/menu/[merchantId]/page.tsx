'use client';

import { useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Menu from '@/components/Menu';

export default function MenuPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;

  return (
    <Layout>
      <Menu merchantId={merchantId} />
    </Layout>
  );
}
