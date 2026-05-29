-- ============================================================
-- SPICY FAIRY TALES — SCHEDULED JOBS (pg_cron)
-- Migration: 005_pg_cron.sql
-- ============================================================
-- NOTE: pg_cron must be enabled in your Supabase project settings
-- (Database > Extensions) before this migration can run successfully.
-- In local dev, add "pg_cron" to the shared_preload_libraries in
-- your postgres config, or enable it via the Supabase dashboard.
-- ============================================================

-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Reset monthly generation counts on the 1st of each month at midnight UTC
SELECT cron.schedule(
  'reset-monthly-generation-counts',
  '0 0 1 * *',
  $$
    UPDATE public.profiles
    SET
      monthly_generation_count = 0,
      monthly_reset_date = date_trunc('month', NOW()) + INTERVAL '1 month'
    WHERE monthly_reset_date <= NOW()
  $$
);

-- Clean up archived chapters older than 90 days (weekly, Sunday 3am UTC)
SELECT cron.schedule(
  'cleanup-archived-chapters',
  '0 3 * * 0',
  $$
    DELETE FROM public.chapters
    WHERE status = 'archived'
      AND archived_at IS NOT NULL
      AND archived_at < NOW() - INTERVAL '90 days'
  $$
);
