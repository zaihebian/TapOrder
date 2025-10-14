'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import { useRouter } from 'next/navigation';

export default function QRTestPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const router = useRouter();

  const handleScan = (data: string) => {
    console.log('Scanned data:', data);
    setScannedData(data);
    setIsScannerOpen(false);
    
    // Test navigation
    if (data) {
      router.push(`/auth?merchantId=${data}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">QR Scanner Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
          >
            Open QR Scanner
          </button>
          
          {scannedData && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-semibold text-green-800">Scanned Data:</h3>
              <p className="text-green-700 font-mono">{scannedData}</p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-semibold text-blue-800">Expected:</h3>
            <p className="text-blue-700 font-mono">cmgqi29kv0000tzkkf3go6nq7</p>
          </div>
        </div>
      </div>

      {isScannerOpen && (
        <QRScanner onClose={() => setIsScannerOpen(false)} />
      )}
    </div>
  );
}
