import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Extend Request interface to include merchant
declare global {
  namespace Express {
    interface Request {
      merchant?: {
        merchantId: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateMerchant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_change_in_production') as {
      merchantId: string;
      email: string;
      role: string;
      iat: number;
      exp: number;
    };

    // Check if it's a merchant token
    if (decoded.role !== 'merchant') {
      return res.status(401).json({
        error: 'Invalid token type. Merchant token required.'
      });
    }

    // Check if merchant still exists and is active
    const merchant = await prisma.merchant.findUnique({
      where: { id: decoded.merchantId }
    });

    if (!merchant) {
      return res.status(401).json({
        error: 'Merchant not found'
      });
    }

    if (!merchant.is_active) {
      return res.status(401).json({
        error: 'Merchant account is inactive'
      });
    }

    // Add merchant info to request object
    req.merchant = {
      merchantId: decoded.merchantId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    console.error('Merchant authentication error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};
