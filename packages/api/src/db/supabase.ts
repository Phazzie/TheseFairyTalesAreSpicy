import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types.js';

// Admin client — uses SERVICE_KEY, bypasses RLS
// SERVER-SIDE ONLY — never expose to client
const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseServiceKey = process.env['SUPABASE_SERVICE_KEY'];
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'];

if (!supabaseUrl) throw new Error('SUPABASE_URL env var is required');
if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_KEY env var is required');
if (!supabaseAnonKey) throw new Error('SUPABASE_ANON_KEY env var is required');

export const adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Create a client that forwards a user's JWT (for RLS-enforced queries)
export function createUserClient(accessToken: string) {
  return createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
