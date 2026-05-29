-- ============================================================
-- SPICY FAIRY TALES — STORAGE BUCKETS
-- Migration: 004_storage_buckets.sql
-- ============================================================

-- Audio storage bucket
-- File size limit: 50 MiB (52428800 bytes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: audio bucket
-- Paths must be prefixed with the user's own UUID folder: {user_id}/...

CREATE POLICY "audio_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audio_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "audio_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
