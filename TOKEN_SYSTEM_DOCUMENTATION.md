# TapOrder Token System Documentation

## Overview

The TapOrder Token System is a comprehensive reward and loyalty program that allows users to earn, track, and redeem tokens for discounts on their orders. The system supports multiple token types, transaction tracking, and flexible reward rules.

## Database Schema

### Core Models

#### 1. TokenType
Defines different types of tokens available in the system.

```prisma
model TokenType {
  id          String   @id @default(cuid())
  name        String   @unique // "reward", "cashback", "referral", "loyalty"
  symbol      String   @unique // "RWD", "CB", "REF", "LOY"
  description String?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relations
  transactions TokenTransaction[]
  rewards      RewardRule[]
  redemptions  TokenRedemption[]
}
```

**Default Token Types:**
- **Reward Tokens (RWD)**: Earned from orders and activities
- **Cashback Tokens (CB)**: Percentage back tokens on purchases
- **Loyalty Tokens (LOY)**: Tokens for frequent customers
- **Referral Tokens (REF)**: Tokens earned from successful referrals

#### 2. TokenTransaction
Tracks all token movements with complete audit trail.

```prisma
model TokenTransaction {
  id            String     @id @default(cuid())
  user_id       String
  token_type_id String
  amount        Int        // Positive for earned, negative for spent
  balance_after Int        // Balance after this transaction
  transaction_type String   // "earned", "spent", "expired", "refunded"
  source_type   String?    // "order", "referral", "signup", "manual"
  source_id     String?    // ID of the source (order_id, referral_id, etc.)
  description   String?
  expires_at    DateTime?  // For time-limited tokens
  created_at    DateTime  @default(now())
}
```

#### 3. RewardRule
Configurable rules for awarding tokens.

```prisma
model RewardRule {
  id            String   @id @default(cuid())
  merchant_id   String?  // Null for global rules
  token_type_id String
  name          String
  description   String?
  trigger_type  String   // "order_amount", "order_count", "signup", "referral"
  trigger_value Float?   // Minimum amount/count to trigger
  reward_amount Int      // Tokens to award
  is_active     Boolean  @default(true)
  valid_from    DateTime @default(now())
  valid_until   DateTime?
}
```

#### 4. TokenRedemption
Tracks token usage for order discounts.

```prisma
model TokenRedemption {
  id            String   @id @default(cuid())
  user_id       String
  order_id      String?
  token_type_id String
  amount        Int      // Tokens redeemed
  discount_amount Float? // Actual discount applied
  status        String   @default("pending") // "pending", "applied", "refunded"
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
}
```

## API Endpoints

### Authentication Required
All token endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### 1. Get Token Balances
**GET** `/api/tokens/balance`

Returns user's current token balances for all active token types.

**Response:**
```json
{
  "message": "Token balances retrieved successfully",
  "balances": [
    {
      "token_type": {
        "id": "reward_tokens",
        "name": "Reward Tokens",
        "symbol": "RWD",
        "description": "Tokens earned from orders and activities"
      },
      "balance": 150
    }
  ]
}
```

### 2. Get Transaction History
**GET** `/api/tokens/transactions`

Retrieves user's token transaction history with pagination.

**Query Parameters:**
- `token_type_id` (optional): Filter by token type
- `limit` (optional, default: 50): Number of transactions to return
- `offset` (optional, default: 0): Number of transactions to skip

**Response:**
```json
{
  "message": "Token transactions retrieved successfully",
  "transactions": [
    {
      "id": "txn_123",
      "amount": 50,
      "balance_after": 150,
      "transaction_type": "earned",
      "source_type": "order",
      "source_id": "order_456",
      "description": "Order completion reward",
      "created_at": "2025-01-15T10:30:00Z",
      "token_type": {
        "id": "reward_tokens",
        "name": "Reward Tokens",
        "symbol": "RWD"
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### 3. Redeem Tokens
**POST** `/api/tokens/redeem`

Redeem tokens for order discount.

**Request Body:**
```json
{
  "order_id": "order_123",
  "token_type_id": "reward_tokens",
  "amount": 100
}
```

**Response:**
```json
{
  "message": "Tokens redeemed successfully",
  "redemption": {
    "id": "red_123",
    "amount": 100,
    "discount_amount": 1.00,
    "status": "applied"
  },
  "order": {
    "id": "order_123",
    "original_amount": 25.00,
    "discount_amount": 1.00,
    "final_amount": 24.00
  }
}
```

### 4. Award Tokens (Admin/Merchant)
**POST** `/api/tokens/award`

Award tokens to a user (typically used by merchants or admins).

**Request Body:**
```json
{
  "user_id": "user_123",
  "token_type_id": "reward_tokens",
  "amount": 50,
  "reason": "Customer service compensation",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "message": "Tokens awarded successfully",
  "transaction": {
    "user_id": "user_123",
    "token_type_id": "reward_tokens",
    "amount": 50,
    "new_balance": 200,
    "reason": "Customer service compensation"
  }
}
```

### 5. Get Token Types
**GET** `/api/tokens/types`

Returns all available token types.

**Response:**
```json
{
  "message": "Token types retrieved successfully",
  "token_types": [
    {
      "id": "reward_tokens",
      "name": "Reward Tokens",
      "symbol": "RWD",
      "description": "Tokens earned from orders and activities",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### 6. Refund Tokens
**POST** `/api/tokens/refund`

Refund tokens for canceled orders.

**Request Body:**
```json
{
  "redemption_id": "red_123"
}
```

**Response:**
```json
{
  "message": "Tokens refunded successfully",
  "refund": {
    "redemption_id": "red_123",
    "amount": 100,
    "new_balance": 150
  }
}
```

## Integration with Order System

### Order Completion Rewards

When an order is completed, the system can automatically award tokens based on configured reward rules:

```typescript
// Example: Award tokens after successful payment
async function awardOrderTokens(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { merchant: true }
  });
  
  // Get applicable reward rules
  const rewardRules = await prisma.rewardRule.findMany({
    where: {
      OR: [
        { merchant_id: order.merchant_id },
        { merchant_id: null } // Global rules
      ],
      trigger_type: 'order_amount',
      trigger_value: { lte: order.total_amount },
      is_active: true
    }
  });
  
  // Award tokens based on rules
  for (const rule of rewardRules) {
    await createTokenTransaction(
      order.user_id,
      rule.token_type_id,
      rule.reward_amount,
      'earned',
      'order',
      orderId,
      `Order completion reward: ${rule.name}`
    );
  }
}
```

### Token Redemption in Orders

When processing orders, check for token redemptions and apply discounts:

```typescript
// Example: Apply token discounts to order
async function applyTokenDiscounts(orderId: string) {
  const redemptions = await prisma.tokenRedemption.findMany({
    where: {
      order_id: orderId,
      status: 'applied'
    }
  });
  
  const totalDiscount = redemptions.reduce(
    (sum, redemption) => sum + redemption.discount_amount,
    0
  );
  
  await prisma.order.update({
    where: { id: orderId },
    data: {
      discount_amount: totalDiscount,
      final_amount: order.total_amount - totalDiscount
    }
  });
}
```

## Business Logic Examples

### 1. Referral Program
```typescript
// When referred user makes first order
async function processReferralReward(referrerUserId: string, newUserId: string) {
  const referralRule = await prisma.rewardRule.findFirst({
    where: {
      trigger_type: 'referral',
      is_active: true
    }
  });
  
  if (referralRule) {
    await createTokenTransaction(
      referrerUserId,
      referralRule.token_type_id,
      referralRule.reward_amount,
      'earned',
      'referral',
      newUserId,
      'Referral bonus'
    );
  }
}
```

### 2. Loyalty Program
```typescript
// Check for loyalty milestones
async function checkLoyaltyMilestones(userId: string) {
  const orderCount = await prisma.order.count({
    where: {
      user_id: userId,
      status: 'paid'
    }
  });
  
  const loyaltyRule = await prisma.rewardRule.findFirst({
    where: {
      trigger_type: 'order_count',
      trigger_value: { lte: orderCount },
      is_active: true
    }
  });
  
  if (loyaltyRule) {
    await createTokenTransaction(
      userId,
      loyaltyRule.token_type_id,
      loyaltyRule.reward_amount,
      'earned',
      'loyalty',
      null,
      `Loyalty milestone: ${orderCount} orders`
    );
  }
}
```

## Migration Guide

### 1. Run Database Migration
```bash
# Apply the token system migration
npx prisma migrate dev --name add_token_system
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Update Existing Orders
```sql
-- Update existing orders to have final_amount
UPDATE orders SET final_amount = total_amount WHERE final_amount = 0;
```

### 4. Migrate Existing Token Balances
```typescript
// Migrate existing token_balance to new system
async function migrateExistingBalances() {
  const users = await prisma.user.findMany({
    where: { token_balance: { gt: 0 } }
  });
  
  for (const user of users) {
    await createTokenTransaction(
      user.id,
      'reward_tokens', // Default token type
      user.token_balance,
      'earned',
      'migration',
      null,
      'Migrated from legacy token balance'
    );
  }
}
```

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Token System Configuration
TOKEN_REDEMPTION_RATE=0.01  # 1 token = $0.01
DEFAULT_TOKEN_EXPIRY_DAYS=365
```

### Default Reward Rules
The migration creates default reward rules:
- **Order Reward**: 10 tokens per $1 spent
- **Cashback**: 5% cashback tokens

## Security Considerations

1. **Token Balance Validation**: Always validate token balances before redemption
2. **Transaction Atomicity**: Use database transactions for token operations
3. **Audit Trail**: All token movements are logged with complete audit trail
4. **Expiration Handling**: Implement cleanup for expired tokens
5. **Rate Limiting**: Consider rate limiting for token operations

## Performance Optimization

1. **Indexes**: Proper indexes on user_id, token_type_id, and created_at
2. **Caching**: Cache token balances for frequently accessed users
3. **Batch Operations**: Use batch operations for bulk token awards
4. **Cleanup**: Regular cleanup of expired tokens and old transactions

## Monitoring and Analytics

### Key Metrics to Track
- Token redemption rates
- Average token balance per user
- Most popular token types
- Token expiration rates
- Reward rule effectiveness

### Example Queries
```sql
-- Top token earners
SELECT u.phone_number, SUM(tt.amount) as total_earned
FROM users u
JOIN token_transactions tt ON u.id = tt.user_id
WHERE tt.transaction_type = 'earned'
GROUP BY u.id, u.phone_number
ORDER BY total_earned DESC
LIMIT 10;

-- Token redemption rate
SELECT 
  COUNT(*) as total_redemptions,
  SUM(amount) as total_tokens_redeemed,
  SUM(discount_amount) as total_discount_given
FROM token_redemptions
WHERE status = 'applied';
```

This comprehensive token system provides a solid foundation for implementing rewards, loyalty programs, and customer engagement features in your TapOrder application.
