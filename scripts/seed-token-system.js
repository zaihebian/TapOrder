const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTokenSystem() {
  try {
    console.log('🌱 Seeding token system...');

    // Create default token types
    const tokenTypes = [
      {
        id: 'reward_tokens',
        name: 'Reward Tokens',
        symbol: 'RWD',
        description: 'Tokens earned from orders and activities',
        is_active: true
      },
      {
        id: 'cashback_tokens',
        name: 'Cashback Tokens',
        symbol: 'CB',
        description: 'Percentage back tokens on purchases',
        is_active: true
      },
      {
        id: 'loyalty_tokens',
        name: 'Loyalty Tokens',
        symbol: 'LOY',
        description: 'Tokens for frequent customers',
        is_active: true
      },
      {
        id: 'referral_tokens',
        name: 'Referral Tokens',
        symbol: 'REF',
        description: 'Tokens earned from successful referrals',
        is_active: true
      }
    ];

    for (const tokenType of tokenTypes) {
      await prisma.tokenType.upsert({
        where: { id: tokenType.id },
        update: tokenType,
        create: tokenType
      });
      console.log(`✅ Created token type: ${tokenType.name}`);
    }

    // Create reward rules for test merchant
    const testMerchantId = 'cmgqi29kv0000tzkkf3go6nq7';
    const rewardRules = [
      {
        id: 'test_reward_rule',
        merchant_id: testMerchantId,
        token_type_id: 'reward_tokens',
        name: 'Order Reward',
        description: 'Earn 1 token per $1 spent',
        trigger_type: 'order_amount',
        trigger_value: 1.0,
        reward_amount: 1,
        is_active: true
      }
    ];

    for (const rule of rewardRules) {
      await prisma.rewardRule.upsert({
        where: { id: rule.id },
        update: rule,
        create: rule
      });
      console.log(`✅ Created reward rule: ${rule.name}`);
    }

    console.log('🎉 Token system seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding token system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTokenSystem();
