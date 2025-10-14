const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function populateTestData() {
  try {
    console.log('🚀 Starting to populate test data...');

    // 1. Create Token Types
    console.log('📝 Creating token types...');
    const rewardToken = await prisma.tokenType.upsert({
      where: { name: 'reward' },
      update: {},
      create: {
        name: 'reward',
        symbol: 'RWD',
        description: 'Reward tokens earned from orders',
        is_active: true
      }
    });

    const cashbackToken = await prisma.tokenType.upsert({
      where: { name: 'cashback' },
      update: {},
      create: {
        name: 'cashback',
        symbol: 'CB',
        description: 'Cashback tokens for discounts',
        is_active: true
      }
    });

    const loyaltyToken = await prisma.tokenType.upsert({
      where: { name: 'loyalty' },
      update: {},
      create: {
        name: 'loyalty',
        symbol: 'LOY',
        description: 'Loyalty program tokens',
        is_active: true
      }
    });

    console.log('✅ Token types created');

    // 2. Create Merchants
    console.log('🏪 Creating merchants...');
    const merchant1 = await prisma.merchant.upsert({
      where: { email: 'pizza@restaurant.com' },
      update: {},
      create: {
        name: 'Mario\'s Pizza Palace',
        email: 'pizza@restaurant.com',
        password_hash: await bcrypt.hash('password123', 10),
        qr_code_url: 'https://taporder.com/menu/pizza-palace',
        token_ratio: 0.01,
        new_user_reward: 50,
        distributor_percent: 5.0,
        is_active: true
      }
    });

    const merchant2 = await prisma.merchant.upsert({
      where: { email: 'burger@restaurant.com' },
      update: {},
      create: {
        name: 'Burger King Deluxe',
        email: 'burger@restaurant.com',
        password_hash: await bcrypt.hash('password123', 10),
        qr_code_url: 'https://taporder.com/menu/burger-king',
        token_ratio: 0.02,
        new_user_reward: 30,
        distributor_percent: 3.0,
        is_active: true
      }
    });

    const merchant3 = await prisma.merchant.upsert({
      where: { email: 'sushi@restaurant.com' },
      update: {},
      create: {
        name: 'Tokyo Sushi Bar',
        email: 'sushi@restaurant.com',
        password_hash: await bcrypt.hash('password123', 10),
        qr_code_url: 'https://taporder.com/menu/tokyo-sushi',
        token_ratio: 0.015,
        new_user_reward: 100,
        distributor_percent: 7.0,
        is_active: true
      }
    });

    console.log('✅ Merchants created');

    // 3. Create Products for each merchant
    console.log('🍕 Creating products...');
    
    // Pizza Palace products
    await prisma.product.createMany({
      data: [
        {
          merchant_id: merchant1.id,
          name: 'Margherita Pizza',
          description: 'Classic tomato, mozzarella, and basil',
          price: 12.99,
          image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400'
        },
        {
          merchant_id: merchant1.id,
          name: 'Pepperoni Pizza',
          description: 'Spicy pepperoni with mozzarella',
          price: 14.99,
          image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'
        },
        {
          merchant_id: merchant1.id,
          name: 'Supreme Pizza',
          description: 'Pepperoni, sausage, peppers, onions, mushrooms',
          price: 18.99,
          image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
        },
        {
          merchant_id: merchant1.id,
          name: 'Caesar Salad',
          description: 'Fresh romaine, parmesan, croutons',
          price: 8.99,
          image_url: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'
        }
      ]
    });

    // Burger King products
    await prisma.product.createMany({
      data: [
        {
          merchant_id: merchant2.id,
          name: 'Classic Burger',
          description: 'Beef patty, lettuce, tomato, onion',
          price: 9.99,
          image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
        },
        {
          merchant_id: merchant2.id,
          name: 'Cheeseburger Deluxe',
          description: 'Double patty with cheese and special sauce',
          price: 12.99,
          image_url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400'
        },
        {
          merchant_id: merchant2.id,
          name: 'Chicken Sandwich',
          description: 'Crispy chicken breast with mayo',
          price: 10.99,
          image_url: 'https://images.unsplash.com/photo-1606755962773-d324e9c8b257?w=400'
        },
        {
          merchant_id: merchant2.id,
          name: 'French Fries',
          description: 'Golden crispy fries',
          price: 4.99,
          image_url: 'https://images.unsplash.com/photo-1576105442-8f1b24fe2c16?w=400'
        }
      ]
    });

    // Sushi Bar products
    await prisma.product.createMany({
      data: [
        {
          merchant_id: merchant3.id,
          name: 'California Roll',
          description: 'Crab, avocado, cucumber',
          price: 8.99,
          image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'
        },
        {
          merchant_id: merchant3.id,
          name: 'Salmon Nigiri',
          description: 'Fresh salmon over sushi rice',
          price: 12.99,
          image_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400'
        },
        {
          merchant_id: merchant3.id,
          name: 'Dragon Roll',
          description: 'Eel, cucumber, avocado, eel sauce',
          price: 15.99,
          image_url: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?w=400'
        },
        {
          merchant_id: merchant3.id,
          name: 'Miso Soup',
          description: 'Traditional Japanese soup',
          price: 3.99,
          image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
        }
      ]
    });

    console.log('✅ Products created');

    // 4. Create Reward Rules
    console.log('🎁 Creating reward rules...');
    await prisma.rewardRule.createMany({
      data: [
        {
          merchant_id: merchant1.id,
          token_type_id: rewardToken.id,
          name: 'Pizza Order Bonus',
          description: 'Earn tokens for pizza orders',
          trigger_type: 'order_amount',
          trigger_value: 15.0,
          reward_amount: 10,
          is_active: true
        },
        {
          merchant_id: merchant2.id,
          token_type_id: rewardToken.id,
          name: 'Burger Loyalty',
          description: 'Earn tokens for burger orders',
          trigger_type: 'order_amount',
          trigger_value: 10.0,
          reward_amount: 5,
          is_active: true
        },
        {
          merchant_id: merchant3.id,
          token_type_id: rewardToken.id,
          name: 'Sushi Premium',
          description: 'Earn tokens for sushi orders',
          trigger_type: 'order_amount',
          trigger_value: 20.0,
          reward_amount: 15,
          is_active: true
        }
      ]
    });

    console.log('✅ Reward rules created');

    // 5. Create Test Users
    console.log('👥 Creating test users...');
    const user1 = await prisma.user.upsert({
      where: { phone_number: '+1234567890' },
      update: {},
      create: {
        phone_number: '+1234567890',
        token_balance: 150
      }
    });

    const user2 = await prisma.user.upsert({
      where: { phone_number: '+1987654321' },
      update: {},
      create: {
        phone_number: '+1987654321',
        token_balance: 75
      }
    });

    const user3 = await prisma.user.upsert({
      where: { phone_number: '+1555123456' },
      update: {},
      create: {
        phone_number: '+1555123456',
        token_balance: 200
      }
    });

    console.log('✅ Test users created');

    // 6. Create Sample Orders
    console.log('📦 Creating sample orders...');
    
    // Get products for orders
    const pizzaProducts = await prisma.product.findMany({
      where: { merchant_id: merchant1.id },
      take: 2
    });

    const burgerProducts = await prisma.product.findMany({
      where: { merchant_id: merchant2.id },
      take: 2
    });

    // Create orders
    const order1 = await prisma.order.create({
      data: {
        user_id: user1.id,
        merchant_id: merchant1.id,
        status: 'paid',
        total_amount: 25.98,
        discount_amount: 2.50,
        final_amount: 23.48,
        payment_intent_id: 'pi_test_123456'
      }
    });

    const order2 = await prisma.order.create({
      data: {
        user_id: user2.id,
        merchant_id: merchant2.id,
        status: 'completed',
        total_amount: 18.98,
        discount_amount: 0,
        final_amount: 18.98,
        payment_intent_id: 'pi_test_789012'
      }
    });

    // Create order items
    await prisma.orderItem.createMany({
      data: [
        {
          order_id: order1.id,
          product_id: pizzaProducts[0].id,
          quantity: 2,
          price: pizzaProducts[0].price
        },
        {
          order_id: order2.id,
          product_id: burgerProducts[0].id,
          quantity: 1,
          price: burgerProducts[0].price
        },
        {
          order_id: order2.id,
          product_id: burgerProducts[1].id,
          quantity: 1,
          price: burgerProducts[1].price
        }
      ]
    });

    console.log('✅ Sample orders created');

    // 7. Create Token Transactions
    console.log('🪙 Creating token transactions...');
    await prisma.tokenTransaction.createMany({
      data: [
        {
          user_id: user1.id,
          token_type_id: rewardToken.id,
          amount: 50,
          balance_after: 50,
          transaction_type: 'earned',
          source_type: 'signup',
          description: 'New user bonus',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        {
          user_id: user1.id,
          token_type_id: rewardToken.id,
          amount: 20,
          balance_after: 70,
          transaction_type: 'earned',
          source_type: 'order',
          source_id: order1.id,
          description: 'Order reward',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        {
          user_id: user1.id,
          token_type_id: rewardToken.id,
          amount: -25,
          balance_after: 45,
          transaction_type: 'spent',
          source_type: 'redemption',
          description: 'Token redemption',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        {
          user_id: user2.id,
          token_type_id: rewardToken.id,
          amount: 30,
          balance_after: 30,
          transaction_type: 'earned',
          source_type: 'signup',
          description: 'New user bonus',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    console.log('✅ Token transactions created');

    // 8. Create Token Redemptions
    console.log('💸 Creating token redemptions...');
    await prisma.tokenRedemption.createMany({
      data: [
        {
          user_id: user1.id,
          order_id: order1.id,
          token_type_id: rewardToken.id,
          amount: 25,
          discount_amount: 2.50,
          status: 'applied'
        }
      ]
    });

    console.log('✅ Token redemptions created');

    console.log('🎉 Test data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- 3 Token Types created`);
    console.log(`- 3 Merchants created`);
    console.log(`- 12 Products created`);
    console.log(`- 3 Reward Rules created`);
    console.log(`- 3 Test Users created`);
    console.log(`- 2 Sample Orders created`);
    console.log(`- 4 Token Transactions created`);
    console.log(`- 1 Token Redemption created`);

    console.log('\n🔗 Test Data Details:');
    console.log(`Merchant 1: ${merchant1.name} (ID: ${merchant1.id})`);
    console.log(`Merchant 2: ${merchant2.name} (ID: ${merchant2.id})`);
    console.log(`Merchant 3: ${merchant3.name} (ID: ${merchant3.id})`);
    console.log(`\nTest Users:`);
    console.log(`- ${user1.phone_number} (Balance: ${user1.token_balance})`);
    console.log(`- ${user2.phone_number} (Balance: ${user2.token_balance})`);
    console.log(`- ${user3.phone_number} (Balance: ${user3.token_balance})`);

  } catch (error) {
    console.error('❌ Error populating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateTestData();
