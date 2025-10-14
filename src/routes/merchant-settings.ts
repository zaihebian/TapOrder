import express, { Request, Response } from 'express';
import { authenticateMerchant } from '../middleware/authenticate-merchant';
import prisma from '../lib/prisma';

const router = express.Router();

// Input validation helper for settings
function validateSettingsInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Merchant name must be a non-empty string');
    }
  }

  if (data.token_ratio !== undefined) {
    if (typeof data.token_ratio !== 'number' || data.token_ratio <= 0) {
      errors.push('Token ratio must be a positive number');
    }
  }

  if (data.new_user_reward !== undefined) {
    if (typeof data.new_user_reward !== 'number' || data.new_user_reward < 0) {
      errors.push('New user reward must be a non-negative number');
    }
  }

  if (data.qr_code_url !== undefined) {
    if (!data.qr_code_url || typeof data.qr_code_url !== 'string' || data.qr_code_url.trim().length === 0) {
      errors.push('QR code URL must be a non-empty string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// GET /merchant/profile - Get merchant profile
router.get('/profile', authenticateMerchant, async (req: Request, res: Response) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchant!.merchantId },
      select: {
        id: true,
        name: true,
        email: true,
        qr_code_url: true,
        token_ratio: true,
        new_user_reward: true,
        distributor_percent: true,
        is_active: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found'
      });
    }

    res.json({
      message: 'Merchant profile retrieved successfully',
      merchant
    });
  } catch (error) {
    console.error('Merchant profile error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /merchant/settings - Get merchant settings (alias for profile)
router.get('/settings', authenticateMerchant, async (req: Request, res: Response) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.merchant!.merchantId },
      select: {
        id: true,
        name: true,
        qr_code_url: true,
        token_ratio: true,
        new_user_reward: true,
        distributor_percent: true,
        is_active: true
      }
    });

    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found'
      });
    }

    res.json({
      message: 'Merchant settings retrieved successfully',
      settings: {
        name: merchant.name,
        qr_code_url: merchant.qr_code_url,
        token_ratio: merchant.token_ratio,
        new_user_reward: merchant.new_user_reward,
        distributor_percent: merchant.distributor_percent,
        is_active: merchant.is_active
      }
    });
  } catch (error) {
    console.error('Merchant settings error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// PUT /merchant/settings - Update merchant settings
router.put('/settings', authenticateMerchant, async (req: Request, res: Response) => {
  try {
    const { name, token_ratio, new_user_reward, qr_code_url, distributor_percent } = req.body;

    // Validate input
    const validation = validateSettingsInput({ name, token_ratio, new_user_reward, qr_code_url });
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Validate distributor_percent if provided
    if (distributor_percent !== undefined) {
      if (typeof distributor_percent !== 'number' || distributor_percent < 0 || distributor_percent > 100) {
        return res.status(400).json({
          error: 'Distributor percent must be a number between 0 and 100'
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (token_ratio !== undefined) updateData.token_ratio = token_ratio;
    if (new_user_reward !== undefined) updateData.new_user_reward = new_user_reward;
    if (qr_code_url !== undefined) updateData.qr_code_url = qr_code_url.trim();
    if (distributor_percent !== undefined) updateData.distributor_percent = distributor_percent;
    updateData.updated_at = new Date();

    // Update merchant
    const updatedMerchant = await prisma.merchant.update({
      where: { id: req.merchant!.merchantId },
      data: updateData,
      select: {
        id: true,
        name: true,
        qr_code_url: true,
        token_ratio: true,
        new_user_reward: true,
        distributor_percent: true,
        is_active: true,
        updated_at: true
      }
    });

    res.json({
      message: 'Merchant settings updated successfully',
      settings: {
        name: updatedMerchant.name,
        qr_code_url: updatedMerchant.qr_code_url,
        token_ratio: updatedMerchant.token_ratio,
        new_user_reward: updatedMerchant.new_user_reward,
        distributor_percent: updatedMerchant.distributor_percent,
        is_active: updatedMerchant.is_active
      }
    });

  } catch (error) {
    console.error('Merchant settings update error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /merchant/analytics - Get merchant analytics
router.get('/analytics', authenticateMerchant, async (req: Request, res: Response) => {
  try {
    const merchantId = req.merchant!.merchantId;
    const { period = '30' } = req.query; // days

    const days = parseInt(period as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get order statistics
    const orderStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        SUM(discount_amount) as total_discounts,
        AVG(total_amount) as avg_order_value,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
      FROM "Order" 
      WHERE merchant_id = ${merchantId} 
      AND created_at >= ${startDate}
    `;

    // Get popular products
    const popularProducts = await prisma.$queryRaw`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        SUM(oi.quantity) as total_quantity,
        COUNT(DISTINCT o.id) as order_count,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM "Product" p
      JOIN "OrderItem" oi ON p.id = oi.product_id
      JOIN "Order" o ON oi.order_id = o.id
      WHERE p.merchant_id = ${merchantId}
      AND o.created_at >= ${startDate}
      GROUP BY p.id, p.name, p.description, p.price, p.image_url
      ORDER BY total_quantity DESC
      LIMIT 10
    `;

    // Get daily order trends
    const dailyTrends = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_revenue
      FROM "Order"
      WHERE merchant_id = ${merchantId}
      AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get customer statistics
    const customerStats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT user_id) as unique_customers,
        COUNT(DISTINCT CASE WHEN created_at >= ${startDate} THEN user_id END) as new_customers
      FROM "Order"
      WHERE merchant_id = ${merchantId}
    `;

    res.json({
      message: 'Analytics retrieved successfully',
      analytics: {
        period_days: days,
        order_stats: orderStats[0] || {
          total_orders: 0,
          total_revenue: 0,
          total_discounts: 0,
          avg_order_value: 0,
          paid_orders: 0,
          pending_orders: 0,
          completed_orders: 0
        },
        popular_products: popularProducts || [],
        daily_trends: dailyTrends || [],
        customer_stats: customerStats[0] || {
          unique_customers: 0,
          new_customers: 0
        }
      }
    });

  } catch (error) {
    console.error('Analytics retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
