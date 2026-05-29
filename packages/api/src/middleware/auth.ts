import { createMiddleware } from 'hono/factory';
import { adminClient } from '../db/supabase.js';

export type Variables = {
  user: { id: string; email?: string };
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized', message: 'Missing or invalid Authorization header' }, 401);
  }
  const token = authHeader.slice(7);
  const {
    data: { user },
    error,
  } = await adminClient.auth.getUser(token);
  if (error || !user) {
    return c.json({ error: 'unauthorized', message: 'Invalid or expired token' }, 401);
  }
  c.set('user', { id: user.id, email: user.email });
  await next();
});
