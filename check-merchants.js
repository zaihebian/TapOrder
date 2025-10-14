const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMerchants() {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('Available merchants:');
    merchants.forEach(merchant => {
      console.log(`- ID: ${merchant.id}`);
      console.log(`  Name: ${merchant.name}`);
    });
    
    console.log(`\nTotal merchants: ${merchants.length}`);
    
    // Check if our QR code merchant exists
    const qrMerchant = merchants.find(m => m.id === 'cmgqv7vbt0003tzkkvu1v0s4v');
    if (qrMerchant) {
      console.log(`\n✅ QR Code merchant found: ${qrMerchant.name}`);
    } else {
      console.log(`\n❌ QR Code merchant NOT found: cmgqv7vbt0003tzkkvu1v0s4v`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMerchants();
