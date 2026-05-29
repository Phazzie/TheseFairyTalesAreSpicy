// Stripe webhook handler
// Verifies webhook signature, handles subscription lifecycle events
import { Hono } from 'hono';

export const stripeWebhookApp = new Hono();

stripeWebhookApp.post('/', async (c) => {
  // Stripe webhook signature verification requires the `stripe` npm package.
  // Until it is added, ALL webhook calls are rejected to prevent unauthorized tier upgrades.
  // To enable:
  //   1. pnpm add stripe --filter @story/api
  //   2. Replace this block with stripe.webhooks.constructEvent(body, signature, secret)
  //   3. Handle checkout.session.completed and customer.subscription.deleted events
  return c.json(
    { error: 'not_implemented', message: 'Webhook verification not yet configured.' },
    501,
  );
});
