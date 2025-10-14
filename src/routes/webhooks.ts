import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../lib/prisma';

const router = express.Router();

// Initialize Stripe
let stripe: Stripe;
try {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
    console.log('⚠️ Stripe secret key not configured - webhook will not work');
    stripe = {} as Stripe; // Dummy object for test mode
  } else {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error);
  stripe = {} as Stripe; // Dummy object to prevent crashes
}

// Stripe webhook endpoint
router.post('/webhook', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
  // Check if Stripe is properly initialized
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key_here') {
    console.log('🧪 Test mode: Webhook received but Stripe not configured');
    return res.json({received: true, message: 'Test mode - Stripe not configured'});
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return res.status(400).send('Webhook Error: STRIPE_WEBHOOK_SECRET not configured');
    }

    if (!sig) {
      console.error('❌ Missing stripe-signature header');
      return res.status(400).send('Webhook Error: Missing stripe-signature header');
    }

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(`✅ Webhook signature verified: ${event.type}`);

  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Processing Stripe webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.created':
        console.log(`📝 Payment intent created: ${event.data.object.id}`);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({error: 'Webhook processing failed'});
  }
});

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  
  if (!orderId) {
    console.error('No order_id found in payment intent metadata');
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    if (order.status === 'paid') {
      console.log(`Order ${orderId} already marked as paid`);
      return;
    }

    // Update order status to paid
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    });

    console.log(`✅ Order ${orderId} marked as paid via webhook`);
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  
  if (!orderId) {
    console.error('No order_id found in payment intent metadata');
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Update order status to failed
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'failed' }
    });

    console.log(`❌ Order ${orderId} marked as failed via webhook`);
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
  }
}

// Handle payment requiring action
async function handlePaymentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  
  if (!orderId) {
    console.error('No order_id found in payment intent metadata');
    return;
  }

  console.log(`⚠️ Order ${orderId} payment requires action: ${paymentIntent.status}`);
  // You might want to notify the user or update order status
}

// Handle canceled payment
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata.order_id;
  
  if (!orderId) {
    console.error('No order_id found in payment intent metadata');
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Update order status to canceled
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'canceled' }
    });

    console.log(`🚫 Order ${orderId} marked as canceled via webhook`);
  } catch (error) {
    console.error(`Error updating order ${orderId}:`, error);
  }
}

export default router;
