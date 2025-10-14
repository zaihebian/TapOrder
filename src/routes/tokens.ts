import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import prisma from '../lib/prisma';

const router = express.Router();

// Helper function to get user's current token balance for a specific token type
async function getUserTokenBalance(userId: string, tokenTypeId: string): Promise<number> {
  const latestTransaction = await prisma.tokenTransaction.findFirst({
    where: {
      user_id: userId,
      token_type_id: tokenTypeId
    },
    orderBy: {
      created_at: 'desc'
    }
  });
  
  return latestTransaction?.balance_after || 0;
}

// Helper function to create a token transaction
async function createTokenTransaction(
  userId: string,
  tokenTypeId: string,
  amount: number,
  transactionType: string,
  sourceType?: string,
  sourceId?: string,
  description?: string,
  expiresAt?: Date
): Promise<void> {
  const currentBalance = await getUserTokenBalance(userId, tokenTypeId);
  const newBalance = currentBalance + amount;
  
  await prisma.tokenTransaction.create({
    data: {
      user_id: userId,
      token_type_id: tokenTypeId,
      amount,
      balance_after: newBalance,
      transaction_type: transactionType,
      source_type: sourceType,
      source_id: sourceId,
      description,
      expires_at: expiresAt
    }
  });
}

// GET /api/tokens/balance - Get user's token balances
router.get('/balance', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Get all active token types
    const tokenTypes = await prisma.tokenType.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true
      }
    });
    
    // Get balances for each token type
    const balances = await Promise.all(
      tokenTypes.map(async (tokenType) => {
        const balance = await getUserTokenBalance(userId, tokenType.id);
        return {
          token_type: tokenType,
          balance
        };
      })
    );
    
    res.json({
      message: 'Token balances retrieved successfully',
      balances
    });
  } catch (error) {
    console.error('Token balance error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/tokens/transactions - Get user's token transaction history
router.get('/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { token_type_id, limit = 50, offset = 0 } = req.query;
    
    const whereClause: any = { user_id: userId };
    if (token_type_id) {
      whereClause.token_type_id = token_type_id as string;
    }
    
    const transactions = await prisma.tokenTransaction.findMany({
      where: whereClause,
      include: {
        token_type: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });
    
    res.json({
      message: 'Token transactions retrieved successfully',
      transactions,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Token transactions error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /api/tokens/redeem - Redeem tokens for order discount
router.post('/redeem', authenticate, async (req: Request, res: Response) => {
  try {
    const { order_id, token_type_id, amount } = req.body;
    const userId = req.user!.userId;
    
    // Validate input
    if (!order_id || !token_type_id || !amount) {
      return res.status(400).json({
        error: 'Order ID, token type ID, and amount are required'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be positive'
      });
    }
    
    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: order_id,
        user_id: userId,
        status: 'pending'
      }
    });
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found or not eligible for token redemption'
      });
    }
    
    // Check if token type exists
    const tokenType = await prisma.tokenType.findUnique({
      where: { id: token_type_id }
    });
    
    if (!tokenType || !tokenType.is_active) {
      return res.status(404).json({
        error: 'Token type not found or inactive'
      });
    }
    
    // Check user's token balance
    const currentBalance = await getUserTokenBalance(userId, token_type_id);
    if (currentBalance < amount) {
      return res.status(400).json({
        error: 'Insufficient token balance',
        details: {
          requested: amount,
          available: currentBalance
        }
      });
    }
    
    // Calculate discount (1 token = $0.01 for now, can be configurable)
    const discountAmount = amount * 0.01;
    const finalAmount = Math.max(0, order.total_amount - discountAmount);
    
    // Create redemption record
    const redemption = await prisma.tokenRedemption.create({
      data: {
        user_id: userId,
        order_id: order_id,
        token_type_id: token_type_id,
        amount: amount,
        discount_amount: discountAmount,
        status: 'applied'
      }
    });
    
    // Update order with discount
    await prisma.order.update({
      where: { id: order_id },
      data: {
        discount_amount: discountAmount,
        final_amount: finalAmount
      }
    });
    
    // Create token transaction (spent)
    await createTokenTransaction(
      userId,
      token_type_id,
      -amount,
      'spent',
      'redemption',
      redemption.id,
      `Token redemption for order ${order_id}`
    );
    
    res.json({
      message: 'Tokens redeemed successfully',
      redemption: {
        id: redemption.id,
        amount: redemption.amount,
        discount_amount: redemption.discount_amount,
        status: redemption.status
      },
      order: {
        id: order_id,
        original_amount: order.total_amount,
        discount_amount: discountAmount,
        final_amount: finalAmount
      }
    });
  } catch (error) {
    console.error('Token redemption error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /api/tokens/award - Award tokens to user (admin/merchant only)
router.post('/award', authenticate, async (req: Request, res: Response) => {
  try {
    const { user_id, token_type_id, amount, reason, expires_at } = req.body;
    
    // Validate input
    if (!user_id || !token_type_id || !amount || !reason) {
      return res.status(400).json({
        error: 'User ID, token type ID, amount, and reason are required'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be positive'
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id }
    });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Check if token type exists
    const tokenType = await prisma.tokenType.findUnique({
      where: { id: token_type_id }
    });
    
    if (!tokenType || !tokenType.is_active) {
      return res.status(404).json({
        error: 'Token type not found or inactive'
      });
    }
    
    // Create token transaction
    await createTokenTransaction(
      user_id,
      token_type_id,
      amount,
      'earned',
      'manual',
      null,
      reason,
      expires_at ? new Date(expires_at) : undefined
    );
    
    const newBalance = await getUserTokenBalance(user_id, token_type_id);
    
    res.json({
      message: 'Tokens awarded successfully',
      transaction: {
        user_id,
        token_type_id,
        amount,
        new_balance: newBalance,
        reason
      }
    });
  } catch (error) {
    console.error('Token award error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /api/tokens/types - Get all available token types
router.get('/types', async (req: Request, res: Response) => {
  try {
    const tokenTypes = await prisma.tokenType.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        symbol: true,
        description: true,
        created_at: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    res.json({
      message: 'Token types retrieved successfully',
      token_types: tokenTypes
    });
  } catch (error) {
    console.error('Token types error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /api/tokens/refund - Refund tokens for canceled order
router.post('/refund', authenticate, async (req: Request, res: Response) => {
  try {
    const { redemption_id } = req.body;
    const userId = req.user!.userId;
    
    if (!redemption_id) {
      return res.status(400).json({
        error: 'Redemption ID is required'
      });
    }
    
    // Find the redemption
    const redemption = await prisma.tokenRedemption.findFirst({
      where: {
        id: redemption_id,
        user_id: userId,
        status: 'applied'
      }
    });
    
    if (!redemption) {
      return res.status(404).json({
        error: 'Redemption not found or not eligible for refund'
      });
    }
    
    // Update redemption status
    await prisma.tokenRedemption.update({
      where: { id: redemption_id },
      data: { status: 'refunded' }
    });
    
    // Refund tokens to user
    await createTokenTransaction(
      userId,
      redemption.token_type_id,
      redemption.amount,
      'refunded',
      'redemption_refund',
      redemption_id,
      `Token refund for redemption ${redemption_id}`
    );
    
    const newBalance = await getUserTokenBalance(userId, redemption.token_type_id);
    
    res.json({
      message: 'Tokens refunded successfully',
      refund: {
        redemption_id: redemption_id,
        amount: redemption.amount,
        new_balance: newBalance
      }
    });
  } catch (error) {
    console.error('Token refund error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
