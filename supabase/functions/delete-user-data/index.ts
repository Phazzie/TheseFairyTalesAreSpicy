// Supabase Edge Function: delete-user-data
// Triggered by a webhook on auth.users DELETE event
// Cleans up all Supabase Storage audio files for the deleted user
//
// Deploy: supabase functions deploy delete-user-data
// Set secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DeleteUserPayload {
  type: 'DELETE';
  table: string;
  record: { id: string; email?: string };
  old_record: null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Verify this request comes from Supabase (check authorization header)
  const authHeader = req.headers.get('Authorization');
  const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: DeleteUserPayload;
  try {
    payload = await req.json() as DeleteUserPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (payload.type !== 'DELETE' || payload.table !== 'users') {
    return new Response('Not a user delete event', { status: 200 });
  }

  const userId = payload.record.id;
  if (!userId) return new Response('No user ID in payload', { status: 400 });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete all audio files for this user from Supabase Storage
  // Audio files are stored at: audio/{user_id}/{arc_id}/{chapter_id}.mp3
  const { data: files, error: listError } = await adminClient.storage
    .from('audio')
    .list(userId);

  if (listError) {
    console.error('Error listing audio files:', listError);
    return new Response(`Storage list error: ${listError.message}`, { status: 500 });
  }

  if (files && files.length > 0) {
    // Remove top-level folder prefix to get all nested files
    const { error: removeError } = await adminClient.storage
      .from('audio')
      .remove(files.map((f) => `${userId}/${f.name}`));

    if (removeError) {
      console.error('Error removing audio files:', removeError);
      return new Response(`Storage remove error: ${removeError.message}`, { status: 500 });
    }
  }

  console.log(`Successfully cleaned up storage for user ${userId}`);
  return new Response(JSON.stringify({ success: true, userId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
