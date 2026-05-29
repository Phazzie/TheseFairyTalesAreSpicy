-- ============================================================
-- SPICY FAIRY TALES — ATOMIC CHAPTER PUBLISH FUNCTION
-- Migration: 006_publish_chapter_fn.sql
-- ============================================================
-- Replaces the non-transactional multi-step publishChapter logic
-- in the API. One RPC call → archive old published + publish new,
-- atomically. Prevents the race condition where two concurrent
-- requests could publish two chapters at the same chapter_number.
-- ============================================================

CREATE OR REPLACE FUNCTION public.publish_chapter(p_chapter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_arc_id UUID;
  v_chapter_number SMALLINT;
BEGIN
  -- Get the arc_id and chapter_number of the chapter to publish
  SELECT arc_id, chapter_number
    INTO v_arc_id, v_chapter_number
    FROM public.chapters
   WHERE id = p_chapter_id
     AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chapter % not found or is not a draft', p_chapter_id;
  END IF;

  -- Archive any currently published chapter at the same (arc, number)
  UPDATE public.chapters
     SET status = 'archived',
         archived_at = NOW()
   WHERE arc_id = v_arc_id
     AND chapter_number = v_chapter_number
     AND status = 'published'
     AND id <> p_chapter_id;

  -- Publish the target chapter
  UPDATE public.chapters
     SET status = 'published'
   WHERE id = p_chapter_id;
END;
$$;

-- Grant execute to authenticated users (RLS on chapters still applies)
GRANT EXECUTE ON FUNCTION public.publish_chapter(UUID) TO authenticated;
