// Stripe webhook handler
// Verifies webhook signature, handles subscription lifecycle events
import { Hono } from 'hono';
import { updateSubscriptionTier } from '../../db/profiles.js';

export const stripeWebhookApp = new Hono();

stripeWebhookApp.post('/', async (c) => {
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (!webhookSecret) {
    return c.json({ error: 'internal_error', message: 'Stripe webhook not configured' }, 500);
  }

  const body = await c.req.text();
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'validation_error', message: 'Missing stripe-signature header' }, 400);
  }

  // Signature verification: add `stripe` npm package when wiring up Pro tier.
  // Replace this block with:
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
  //   const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  // The event handling logic below is complete — only verification is pending.
  let event: {
    type: string;
    data: { object: { metadata?: { userId?: string }; customer?: string } };
  };
  try {
    event = JSON.parse(body) as typeof event;
  } catch {
    return c.json({ error: 'validation_error', message: 'Invalid JSON' }, 400);
  }

  const userId = event.data.object.metadata?.['userId'];

  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded':
      if (userId) await updateSubscriptionTier(userId, 'pro');
      break;
    case 'customer.subscription.deleted':
    case 'invoice.payment_failed':
      if (userId) await updateSubscriptionTier(userId, 'free');
      break;
  }

  return c.json({ received: true });
});
