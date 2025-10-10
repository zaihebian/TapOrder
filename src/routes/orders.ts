import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Input validation helper for order items
function validateOrderItems(items: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Order items array is required and must not be empty');
    return { isValid: false, errors };
  }

  items.forEach((item, index) => {
    if (!item.product_id || typeof item.product_id !== 'string') {
      errors.push(`Item ${index + 1}: Product ID is required and must be a string`);
    }
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity is required and must be a positive number`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// POST /orders - Create order and order items
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { merchant_id, items } = req.body;

    // Validate input
    if (!merchant_id || typeof merchant_id !== 'string') {
      return res.status(400).json({
        error: 'Merchant ID is required and must be a string'
      });
    }

    const validation = validateOrderItems(items);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Check if merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchant_id }
    });

    if (!merchant) {
      return res.status(404).json({
        error: 'Merchant not found'
      });
    }

    // Verify all products exist and belong to the merchant
    const productIds = items.map((item: any) => item.product_id);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchant_id: merchant_id
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        error: 'One or more products not found or do not belong to this merchant'
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = items.map((item: any) => {
      const product = products.find(p => p.id === item.product_id);
      const itemTotal = product!.price * item.quantity;
      totalAmount += itemTotal;
      
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: product!.price
      };
    });

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          user_id: req.user!.userId,
          merchant_id: merchant_id,
          total_amount: totalAmount,
          status: 'pending'
        }
      });

      // Create order items
      const orderItems = await Promise.all(
        orderItemsData.map((itemData: any) =>
          tx.orderItem.create({
            data: {
              order_id: newOrder.id,
              ...itemData
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  image_url: true
                }
              }
            }
          })
        )
      );

      return {
        ...newOrder,
        orderItems
      };
    });

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        merchant_id: order.merchant_id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
        items: order.orderItems.map(item => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          price: item.price
        }))
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /orders/:id/pay - Process Stripe payment and update order status
router.post('/:id/pay', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const { payment_method_id } = req.body;

    // Validate input
    if (!payment_method_id || typeof payment_method_id !== 'string') {
      return res.status(400).json({
        error: 'Payment method ID is required and must be a string'
      });
    }

    // Find the order with proper includes
    const order = await prisma.order.findFirst({
      where: {
        id: orderId!,
        user_id: req.user!.userId
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image_url: true
              }
            }
          }
        },
        merchant: {
          select: {
            id: true,
            name: true,
            qr_code_url: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Order has already been processed'
      });
    }

    // Process payment with Stripe
    try {
      // Check if we're in test mode (no real Stripe key)
      const isTestMode = !process.env.STRIPE_SECRET_KEY || 
                        process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key_here' ||
                        process.env.STRIPE_SECRET_KEY.length < 20;
      
      if (isTestMode) {
        // Simulate successful payment for testing
        console.log('🧪 Test mode: Simulating successful payment');
        
        // Update order status to paid
        const updatedOrder = await prisma.order.update({
          where: { id: orderId! },
          data: { status: 'paid' },
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image_url: true
                  }
                }
              }
            },
            merchant: {
              select: {
                id: true,
                name: true,
                qr_code_url: true
              }
            }
          }
        });

        res.json({
          message: 'Payment successful (test mode)',
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            total_amount: updatedOrder.total_amount,
            payment_intent_id: 'pi_test_' + Date.now(),
            merchant: updatedOrder.merchant,
            items: updatedOrder.orderItems.map((item: any) => ({
              id: item.id,
              product: item.product,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity
            }))
          }
        });
        return;
      }

      // Production Stripe payment processing
      console.log('🚀 Production mode: Processing real Stripe payment');

      // Validate payment method first
      let paymentMethod;
      try {
        paymentMethod = await stripe.paymentMethods.retrieve(payment_method_id);
        if (!paymentMethod) {
          return res.status(400).json({
            error: 'Invalid payment method'
          });
        }
      } catch (pmError) {
        console.error('Payment method validation error:', pmError);
        return res.status(400).json({
          error: 'Invalid payment method',
          details: 'The payment method could not be validated'
        });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total_amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: payment_method_id,
        confirm: true,
        description: `Order #${order.id} from ${order.merchant.name}`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          order_id: order.id,
          user_id: req.user!.userId,
          merchant_id: order.merchant_id,
          merchant_name: order.merchant.name
        },
        receipt_email: req.user!.phone_number // Use phone as contact
      });

      console.log(`Payment intent created: ${paymentIntent.id}, Status: ${paymentIntent.status}`);

      if (paymentIntent.status === 'succeeded') {
        // Update order status to paid
        const updatedOrder = await prisma.order.update({
          where: { id: orderId! },
          data: { status: 'paid' },
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image_url: true
                  }
                }
              }
            },
            merchant: {
              select: {
                id: true,
                name: true,
                qr_code_url: true
              }
            }
          }
        });

        console.log(`Order ${order.id} payment successful`);

        // Store payment intent ID in database
        await prisma.order.update({
          where: { id: orderId! },
          data: { payment_intent_id: paymentIntent.id }
        });

        res.json({
          message: 'Payment successful',
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            total_amount: updatedOrder.total_amount,
            payment_intent_id: paymentIntent.id,
            merchant: updatedOrder.merchant,
            items: updatedOrder.orderItems.map((item: any) => ({
              id: item.id,
              product: item.product,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity
            }))
          }
        });
      } else if (paymentIntent.status === 'requires_action') {
        res.status(400).json({
          error: 'Payment requires additional action',
          details: 'Please complete the payment authentication',
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret
        });
      } else {
        res.status(400).json({
          error: 'Payment failed',
          details: paymentIntent.last_payment_error?.message || 'Payment could not be processed',
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status
        });
      }
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeCardError') {
        res.status(400).json({
          error: 'Card error',
          details: stripeError.message,
          code: stripeError.code
        });
      } else if (stripeError.type === 'StripeRateLimitError') {
        res.status(429).json({
          error: 'Rate limit exceeded',
          details: 'Too many requests. Please try again later.'
        });
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        res.status(400).json({
          error: 'Invalid request',
          details: stripeError.message
        });
      } else if (stripeError.type === 'StripeAPIError') {
        res.status(500).json({
          error: 'Payment service error',
          details: 'There was an issue with the payment service. Please try again.'
        });
      } else {
        res.status(400).json({
          error: 'Payment processing failed',
          details: stripeError.message || 'Unknown payment error'
        });
      }
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// POST /orders/:id/refund - Process refund for a paid order
router.post('/:id/refund', authenticate, async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const { amount, reason } = req.body;

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId!,
        user_id: req.user!.userId
      },
      include: {
        merchant: {
          select: {
            name: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    if (order.status !== 'paid') {
      return res.status(400).json({
        error: 'Only paid orders can be refunded'
      });
    }

    // Check if we're in test mode
    const isTestMode = !process.env.STRIPE_SECRET_KEY || 
                      process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key_here' ||
                      process.env.STRIPE_SECRET_KEY.length < 20;

    if (isTestMode) {
      // Simulate refund for testing
      console.log('🧪 Test mode: Simulating refund');
      
      const updatedOrder = await prisma.order.update({
        where: { id: orderId! },
        data: { status: 'refunded' }
      });

      res.json({
        message: 'Refund successful (test mode)',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          refund_amount: amount || order.total_amount
        }
      });
      return;
    }

    // Production refund processing
    console.log('🚀 Production mode: Processing real refund');

    try {
      // Create refund
      const refundParams: any = {
        payment_intent: order.payment_intent_id || '',
        reason: reason || 'requested_by_customer',
        metadata: {
          order_id: order.id,
          user_id: req.user!.userId,
          merchant_id: order.merchant_id
        }
      };

      // Only add amount if specified (partial refund)
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundParams);

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: orderId! },
        data: { status: 'refunded' }
      });

      console.log(`Refund successful for order ${order.id}: ${refund.id}`);

      res.json({
        message: 'Refund successful',
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
          refund_amount: amount || order.total_amount
        },
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
          reason: refund.reason
        }
      });

    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError);
      
      if (stripeError.type === 'StripeInvalidRequestError') {
        res.status(400).json({
          error: 'Refund failed',
          details: stripeError.message
        });
      } else {
        res.status(500).json({
          error: 'Refund processing failed',
          details: 'There was an issue processing the refund. Please try again.'
        });
      }
    }

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;
