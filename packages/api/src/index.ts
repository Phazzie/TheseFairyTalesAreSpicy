import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { generateApp } from './handlers/generate.js';
import { continueApp } from './handlers/continue.js';
import { arcsApp } from './handlers/arcs.js';
import { charactersApp } from './handlers/characters.js';
import { plotThreadsApp } from './handlers/plotThreads.js';
import { chaptersApp } from './handlers/chapters.js';
import { stripeWebhookApp } from './handlers/webhooks/stripe.js';

const app = new Hono();

// Global middleware
app.use('*', corsMiddleware);

// Routes
app.route('/api/generate', generateApp);
app.route('/api/continue', continueApp);
app.route('/api/arcs', arcsApp);
app.route('/api/arcs', charactersApp); // mounted at /api/arcs/:arcId/characters
app.route('/api/arcs', plotThreadsApp); // mounted at /api/arcs/:arcId/threads
app.route('/api/arcs', chaptersApp); // mounted at /api/arcs/:arcId/chapters
app.route('/api/webhooks/stripe', stripeWebhookApp);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;
