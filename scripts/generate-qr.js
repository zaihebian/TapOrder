const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Your test merchant ID
const merchantId = 'cmgqi29kv0000tzkkf3go6nq7';

async function generateQRCode() {
  try {
    // Generate QR code as PNG
    const qrCodeDataURL = await QRCode.toDataURL(merchantId, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save to file
    const outputPath = path.join(__dirname, '..', 'test-qr-code.png');
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    
    fs.writeFileSync(outputPath, base64Data, 'base64');
    
    console.log('✅ QR Code generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`🔗 Merchant ID: ${merchantId}`);
    console.log('\n📱 To test:');
    console.log('1. Open your TapOrder app');
    console.log('2. Tap the QR scanner button');
    console.log('3. Scan this QR code');
    console.log('4. You should be redirected to the auth page');
    console.log('5. After login, you\'ll see the merchant\'s menu');
    
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
  }
}

generateQRCode();
