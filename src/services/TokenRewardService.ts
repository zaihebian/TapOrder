import prisma from '../lib/prisma';

export interface TokenReward {
  tokenTypeId: string;
  amount: number;
  description: string;
}

export class TokenRewardService {
  /**
   * Award tokens to a user based on order completion
   */
  static async awardOrderTokens(userId: string, orderId: string, orderAmount: number, merchantId: string): Promise<TokenReward[]> {
    try {
      console.log(`🎁 Awarding tokens for order ${orderId}, amount: $${orderAmount}`);

      // Get merchant's reward rules
      const rewardRules = await prisma.rewardRule.findMany({
        where: {
          merchant_id: merchantId,
          is_active: true,
          trigger_type: 'order_amount'
        },
        include: {
          tokenType: true
        }
      });

      const awardedTokens: TokenReward[] = [];

      // Process each reward rule
      for (const rule of rewardRules) {
        if (orderAmount >= rule.trigger_value) {
          // Calculate token amount based on rule
          let tokenAmount = 0;
          
          if (rule.reward_type === 'fixed') {
            tokenAmount = rule.reward_amount;
          } else if (rule.reward_type === 'percentage') {
            tokenAmount = Math.floor(orderAmount * (rule.reward_amount / 100));
          }

          if (tokenAmount > 0) {
            // Create token transaction
            const transaction = await prisma.tokenTransaction.create({
              data: {
                user_id: userId,
                token_type_id: rule.token_type_id,
                amount: tokenAmount,
                transaction_type: 'earned',
                description: `Order reward: ${rule.name}`,
                order_id: orderId,
                expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
              }
            });

            // Update user's token balance
            await prisma.user.update({
              where: { id: userId },
              data: {
                token_balance: {
                  increment: tokenAmount
                }
              }
            });

            awardedTokens.push({
              tokenTypeId: rule.token_type_id,
              amount: tokenAmount,
              description: `Earned ${tokenAmount} ${rule.tokenType.symbol} tokens`
            });

            console.log(`✅ Awarded ${tokenAmount} ${rule.tokenType.symbol} tokens to user ${userId}`);
          }
        }
      }

      // Award new user bonus if this is their first order
      const userOrderCount = await prisma.order.count({
        where: { user_id: userId }
      });

      if (userOrderCount === 1) {
        const merchant = await prisma.merchant.findUnique({
          where: { id: merchantId },
          select: { new_user_reward: true }
        });

        if (merchant && merchant.new_user_reward > 0) {
          const newUserTransaction = await prisma.tokenTransaction.create({
            data: {
              user_id: userId,
              token_type_id: 'reward_tokens',
              amount: merchant.new_user_reward,
              transaction_type: 'earned',
              description: 'New user bonus',
              order_id: orderId,
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
          });

          await prisma.user.update({
            where: { id: userId },
            data: {
              token_balance: {
                increment: merchant.new_user_reward
              }
            }
          });

          awardedTokens.push({
            tokenTypeId: 'reward_tokens',
            amount: merchant.new_user_reward,
            description: `New user bonus: ${merchant.new_user_reward} RWD tokens`
          });

          console.log(`🎉 Awarded new user bonus: ${merchant.new_user_reward} RWD tokens`);
        }
      }

      return awardedTokens;
    } catch (error) {
      console.error('Error awarding tokens:', error);
      throw error;
    }
  }

  /**
   * Calculate available tokens for redemption
   */
  static async getAvailableTokensForRedemption(userId: string, merchantId: string): Promise<any[]> {
    try {
      const tokens = await prisma.tokenTransaction.findMany({
        where: {
          user_id: userId,
          transaction_type: 'earned',
          expires_at: {
            gt: new Date()
          },
          amount: {
            gt: 0
          }
        },
        include: {
          tokenType: true
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Group by token type and calculate available amounts
      const tokenMap = new Map();
      
      for (const token of tokens) {
        const key = token.token_type_id;
        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            tokenTypeId: token.token_type_id,
            tokenType: token.tokenType,
            availableAmount: 0,
            transactions: []
          });
        }
        
        const tokenGroup = tokenMap.get(key);
        tokenGroup.availableAmount += token.amount;
        tokenGroup.transactions.push(token);
      }

      return Array.from(tokenMap.values());
    } catch (error) {
      console.error('Error getting available tokens:', error);
      throw error;
    }
  }

  /**
   * Redeem tokens for order discount
   */
  static async redeemTokens(userId: string, orderId: string, redemptions: Array<{tokenTypeId: string, amount: number}>): Promise<number> {
    try {
      console.log(`💸 Redeeming tokens for order ${orderId}:`, redemptions);

      let totalDiscount = 0;

      for (const redemption of redemptions) {
        // Create redemption transaction
        const redemptionTransaction = await prisma.tokenRedemption.create({
          data: {
            user_id: userId,
            token_type_id: redemption.tokenTypeId,
            amount: redemption.amount,
            order_id: orderId || null,
            description: `Token redemption for order ${orderId || 'pending'}`
          }
        });

        // Create negative token transaction
        await prisma.tokenTransaction.create({
          data: {
            user_id: userId,
            token_type_id: redemption.tokenTypeId,
            amount: -redemption.amount,
            transaction_type: 'redeemed',
            description: `Redeemed for order ${orderId || 'pending'}`,
            order_id: orderId || null,
            redemption_id: redemptionTransaction.id
          }
        });

        // Update user's token balance
        await prisma.user.update({
          where: { id: userId },
          data: {
            token_balance: {
              decrement: redemption.amount
            }
          }
        });

        // Calculate discount (1 token = $0.01 for now, can be made configurable)
        totalDiscount += redemption.amount * 0.01;

        console.log(`✅ Redeemed ${redemption.amount} tokens, discount: $${redemption.amount * 0.01}`);
      }

      return totalDiscount;
    } catch (error) {
      console.error('Error redeeming tokens:', error);
      throw error;
    }
  }

  /**
   * Clean up expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired tokens...');

      const expiredTransactions = await prisma.tokenTransaction.findMany({
        where: {
          expires_at: {
            lt: new Date()
          },
          transaction_type: 'earned',
          amount: {
            gt: 0
          }
        }
      });

      for (const transaction of expiredTransactions) {
        // Create expiration transaction
        await prisma.tokenTransaction.create({
          data: {
            user_id: transaction.user_id,
            token_type_id: transaction.token_type_id,
            amount: -transaction.amount,
            transaction_type: 'expired',
            description: `Tokens expired: ${transaction.description}`,
            expires_at: transaction.expires_at
          }
        });

        // Update user's token balance
        await prisma.user.update({
          where: { id: transaction.user_id },
          data: {
            token_balance: {
              decrement: transaction.amount
            }
          }
        });
      }

      console.log(`✅ Cleaned up ${expiredTransactions.length} expired token transactions`);
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw error;
    }
  }
}
