import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In-memory storage for verification codes (expires automatically)
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate phone number format
function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

// POST /auth/register - Send SMS verification code
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;

    // Validate input
    if (!phone_number) {
      return res.status(400).json({
        error: 'Phone number is required'
      });
    }

    if (!isValidPhoneNumber(phone_number)) {
      return res.status(400).json({
        error: 'Invalid phone number format'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code in memory
    verificationCodes.set(phone_number, {
      code: verificationCode,
      expires: expiresAt
    });

    // Check if user already exists, create if not
    const existingUser = await prisma.user.findUnique({
      where: { phone_number }
    });

    if (!existingUser) {
      // Create new user (without verification fields)
      await prisma.user.create({
        data: {
          phone_number
        }
      });
    }

    // Send SMS via Twilio
    try {
      await twilioClient.messages.create({
        body: `Your TapOrder verification code is: ${verificationCode}. This code expires in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: phone_number
      });

      res.json({
        message: 'Verification code sent successfully',
        phone_number
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      res.status(500).json({
        error: 'Failed to send verification code. Please check your phone number.'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /auth/login - Verify code and return JWT
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone_number, verification_code } = req.body;

    // Validate input
    if (!phone_number || !verification_code) {
      return res.status(400).json({
        error: 'Phone number and verification code are required'
      });
    }

    if (!isValidPhoneNumber(phone_number)) {
      return res.status(400).json({
        error: 'Invalid phone number format'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { phone_number }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please register first.'
      });
    }

    // Check verification code from memory
    const storedVerification = verificationCodes.get(phone_number);
    
    if (!storedVerification) {
      return res.status(400).json({
        error: 'No verification code found. Please request a new code.'
      });
    }

    // Check if code has expired
    if (Date.now() > storedVerification.expires) {
      verificationCodes.delete(phone_number); // Clean up expired code
      return res.status(400).json({
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Verify the code
    if (storedVerification.code !== verification_code) {
      return res.status(400).json({
        error: 'Invalid verification code'
      });
    }

    // Clear verification code after successful verification
    verificationCodes.delete(phone_number);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        phone_number: user.phone_number 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone_number: user.phone_number,
        token_balance: user.token_balance
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;

