import express, { Request, Response } from 'express';
import { authenticateMerchant } from '../middleware/authenticate-merchant';
import prisma from '../lib/prisma';

const router = express.Router();

// Input validation helper
function validateProductInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Product name is required and must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Product description is required and must be a non-empty string');
  }

  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.push('Product price is required and must be a positive number');
  }

  if (!data.image_url || typeof data.image_url !== 'string' || data.image_url.trim().length === 0) {
    errors.push('Product image URL is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// POST /merchant/products - Create new product (requires merchant authentication)
router.post('/merchant/products', authenticateMerchant, async (req: Request, res: Response) => {
  try {
    const { name, description, price, image_url } = req.body;

    // Validate input
    const validation = validateProductInput({ name, description, price, image_url });
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Use authenticated merchant ID
    const merchantId = req.merchant!.merchantId;

    // Create the product
    const product = await prisma.product.create({
      data: {
        merchant_id: merchantId,
        name: name.trim(),
        description: description.trim(),
        price: price,
        image_url: image_url.trim()
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        merchant: product.merchant,
        created_at: product.created_at
      }
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// GET /stores/:id/menu - List products for a specific merchant
router.get('/stores/:id/menu', async (req: Request, res: Response) => {
  try {
    const merchantId = req.params.id;

    // Validate merchant ID
    if (!merchantId || merchantId.trim().length === 0) {
      return res.status(400).json({
        error: 'Merchant ID is required'
      });
    }

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        name: true,
        qr_code_url: true
      }
    });

    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found'
      });
    }

    // Get all products for this merchant
    const products = await prisma.product.findMany({
      where: { merchant_id: merchantId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image_url: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      message: 'Menu retrieved successfully',
      merchant: {
        id: merchant.id,
        name: merchant.name,
        qr_code_url: merchant.qr_code_url
      },
      products: products,
      total_products: products.length
    });

  } catch (error) {
    console.error('Menu retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
