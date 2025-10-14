const QRCode = require('qrcode');
const fs = require('fs');

async function generateQRCode() {
  try {
    // Point to auth page with merchant ID as parameter (correct flow)
    const merchantId = 'cmgqv7vbt0003tzkkvu1v0s4v'; // Mario's Pizza Palace
    const url = merchantId; // Just the merchant ID, not the full URL
    
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
    console.log(`🌐 Frontend URL: http://localhost:3001`);
    
    console.log('\n📱 Correct Flow:');
    console.log('1. Scan QR code → redirects to /auth?merchantId=...');
    console.log('2. User logs in with phone number');
    console.log('3. After login → redirects to /menu/${merchantId}');
    console.log('4. User sees Mario\'s Pizza Palace menu');
    
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
  }
}

generateQRCode();
