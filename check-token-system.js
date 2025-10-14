const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTokenSystem() {
  try {
    // Check reward rules
    const rewardRules = await prisma.rewardRule.findMany({
      include: {
        token_type: true,
        merchant: {
          select: { name: true }
        }
      }
    });
    
    console.log('Reward Rules:');
    rewardRules.forEach(rule => {
      console.log(`- ${rule.name}: ${rule.reward_amount} tokens for $${rule.trigger_value} order`);
      console.log(`  Merchant: ${rule.merchant.name}, Token: ${rule.token_type.symbol}`);
    });
    
    // Check token types
    const tokenTypes = await prisma.tokenType.findMany();
    console.log('\nToken Types:');
    tokenTypes.forEach(type => {
      console.log(`- ${type.name} (${type.symbol}): ${type.is_active ? 'Active' : 'Inactive'}`);
    });
    
    // Check recent orders
    const recentOrders = await prisma.order.findMany({
      take: 3,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { phone_number: true } },
        merchant: { select: { name: true } }
      }
    });
    
    console.log('\nRecent Orders:');
    recentOrders.forEach(order => {
      console.log(`- Order ${order.id}: $${order.total_amount} from ${order.merchant.name} by ${order.user.phone_number}`);
      console.log(`  Status: ${order.status}, Created: ${order.created_at}`);
    });
    
    // Check token transactions
    const tokenTransactions = await prisma.tokenTransaction.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { phone_number: true } },
        token_type: { select: { symbol: true } }
      }
    });
    
    console.log('\nRecent Token Transactions:');
    tokenTransactions.forEach(tx => {
      console.log(`- ${tx.transaction_type}: ${tx.amount} ${tx.token_type.symbol} tokens`);
      console.log(`  User: ${tx.user.phone_number}, Balance after: ${tx.balance_after}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTokenSystem();
