import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      console.log('⚠️ Stripe webhook secret not configured - skipping signature verification');
      // In development, parse the event directly
      event = JSON.parse(req.body.toString());
    } else {
      // In production, verify the webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received Stripe webhook: ${event.type}`);

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

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error('Error processing webhook:', error);
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
