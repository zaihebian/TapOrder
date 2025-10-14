import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = express.Router();

// Input validation helper
function validateMerchantInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Merchant name is required and must be a non-empty string');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
    errors.push('Email is required and must be a non-empty string');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  if (!data.qr_code_url || typeof data.qr_code_url !== 'string' || data.qr_code_url.trim().length === 0) {
    errors.push('QR code URL is required and must be a non-empty string');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// POST /merchant/register - Register new merchant
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, qr_code_url, token_ratio = 1.0, new_user_reward = 0 } = req.body;

    // Validate input
    const validation = validateMerchantInput({ name, email, password, qr_code_url });
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Validate additional fields
    if (typeof token_ratio !== 'number' || token_ratio <= 0) {
      return res.status(400).json({
        error: 'Token ratio must be a positive number'
      });
    }

    if (typeof new_user_reward !== 'number' || new_user_reward < 0) {
      return res.status(400).json({
        error: 'New user reward must be a non-negative number'
      });
    }

    // Check if merchant already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingMerchant) {
      return res.status(400).json({
        error: 'Merchant with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create merchant
    const merchant = await prisma.merchant.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        qr_code_url: qr_code_url.trim(),
        token_ratio,
        new_user_reward,
        is_active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        qr_code_url: true,
        token_ratio: true,
        new_user_reward: true,
        is_active: true,
        created_at: true
      }
    });

    res.status(201).json({
      message: 'Merchant registered successfully',
      merchant
    });

  } catch (error) {
    console.error('Merchant registration error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /merchant/login - Merchant login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!merchant) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    if (!merchant.is_active) {
      return res.status(401).json({
        error: 'Merchant account is inactive'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, merchant.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        merchantId: merchant.id, 
        email: merchant.email,
        role: 'merchant'
      },
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        qr_code_url: merchant.qr_code_url,
        token_ratio: merchant.token_ratio,
        new_user_reward: merchant.new_user_reward,
        is_active: merchant.is_active
      }
    });

  } catch (error) {
    console.error('Merchant login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
