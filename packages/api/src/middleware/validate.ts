import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, target: 'json' | 'query' | 'param' = 'json') {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'validation_error',
          message: 'Invalid request data',
          details: result.error.flatten(),
        },
        400,
      );
    }
  });
}
