-- Composite index for the hottest query pattern:
-- getChaptersByArc(arcId, published) ORDER BY chapter_number
-- Allows Postgres to skip the sort step entirely
CREATE INDEX IF NOT EXISTS idx_chapters_arc_status_number
  ON public.chapters (arc_id, status, chapter_number);

-- Drop the unused archived index (it indexes archived_at for archived rows,
-- which is never queried — only costs INSERT overhead)
DROP INDEX IF EXISTS idx_chapters_archived;

-- Covering index for arc list (user_id + created_at for ORDER BY)
CREATE INDEX IF NOT EXISTS idx_arcs_user_created
  ON public.arcs (user_id, created_at DESC);
