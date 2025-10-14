'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleQRTest() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data);
    setIsOpen(false);
    router.push(`/auth?merchantId=${data}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple QR Test</h1>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Open QR Scanner
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">QR Scanner</h2>
            <p className="mb-4">This is a placeholder for the QR scanner.</p>
            <p className="mb-4">Expected merchant ID: cmgqi29kv0000tzkkf3go6nq7</p>
            <div className="space-x-2">
              <button
                onClick={() => handleQRScan('cmgqi29kv0000tzkkf3go6nq7')}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Simulate Scan
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
