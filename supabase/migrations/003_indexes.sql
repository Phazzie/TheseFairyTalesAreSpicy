-- ============================================================
-- SPICY FAIRY TALES — PERFORMANCE INDEXES
-- Migration: 003_indexes.sql
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_arcs_user_id ON public.arcs (user_id);

CREATE INDEX IF NOT EXISTS idx_characters_arc_id ON public.characters (arc_id);
CREATE INDEX IF NOT EXISTS idx_characters_arc_protagonist ON public.characters (arc_id, is_protagonist);

CREATE INDEX IF NOT EXISTS idx_chapters_arc_status ON public.chapters (arc_id, status);
CREATE INDEX IF NOT EXISTS idx_chapters_arc_number ON public.chapters (arc_id, chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_archived ON public.chapters (archived_at) WHERE status = 'archived';

CREATE INDEX IF NOT EXISTS idx_plot_threads_arc_status ON public.plot_threads (arc_id, status);

CREATE INDEX IF NOT EXISTS idx_arc_summaries_arc_milestone ON public.arc_summaries (arc_id, chapter_milestone DESC);

CREATE INDEX IF NOT EXISTS idx_relationship_map_arc_id ON public.relationship_map (arc_id);

CREATE INDEX IF NOT EXISTS idx_world_notes_arc_active ON public.world_notes (arc_id, is_active, created_at DESC);
