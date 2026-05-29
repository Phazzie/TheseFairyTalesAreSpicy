import { cors } from 'hono/cors';

const allowedOrigins = (process.env['FRONTEND_URL'] ?? 'http://localhost:8081').split(',');

export const corsMiddleware = cors({
  origin: allowedOrigins,
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
