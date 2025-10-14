const QRCode = require('qrcode');
const fs = require('fs');

async function generateQRCode() {
  try {
    // Use one of the actual merchant IDs from the test data
    const merchantId = 'cmgqv7vbt0003tzkkvu1v0s4v'; // Mario's Pizza Palace
    const url = `http://localhost:3000/stores/${merchantId}/menu`;
    
    console.log(`🔗 Generating QR code for: ${url}`);
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Convert data URL to buffer
    const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save to file
    fs.writeFileSync('test-qr-code.png', buffer);
    
    console.log('✅ QR Code generated successfully!');
    console.log(`📁 Saved to: ${process.cwd()}/test-qr-code.png`);
    console.log(`🔗 Merchant ID: ${merchantId}`);
    console.log(`🏪 Restaurant: Mario's Pizza Palace`);
    
    console.log('\n📱 To test:');
    console.log('1. Open your TapOrder app');
    console.log('2. Tap the QR scanner button');
    console.log('3. Scan this QR code');
    console.log('4. You should be redirected to the auth page');
    console.log('5. After login, you\'ll see Mario\'s Pizza Palace menu');
    
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
  }
}

generateQRCode();
