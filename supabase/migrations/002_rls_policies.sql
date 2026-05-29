-- ============================================================
-- SPICY FAIRY TALES — ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- ============================================================
-- Child table policies use EXISTS JOIN through arcs, never owns_arc().
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- ARCS
-- ============================================================

ALTER TABLE public.arcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arcs_select_own" ON public.arcs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "arcs_insert_own" ON public.arcs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "arcs_update_own" ON public.arcs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "arcs_delete_own" ON public.arcs
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- CHARACTERS
-- ============================================================

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "characters_select_own" ON public.characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = characters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = characters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = characters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "characters_delete_own" ON public.characters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = characters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

-- ============================================================
-- RELATIONSHIP MAP
-- ============================================================

ALTER TABLE public.relationship_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_map_select_own" ON public.relationship_map
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = relationship_map.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "relationship_map_insert_own" ON public.relationship_map
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = relationship_map.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "relationship_map_update_own" ON public.relationship_map
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = relationship_map.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "relationship_map_delete_own" ON public.relationship_map
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = relationship_map.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

-- ============================================================
-- PLOT THREADS
-- ============================================================

ALTER TABLE public.plot_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plot_threads_select_own" ON public.plot_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = plot_threads.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "plot_threads_insert_own" ON public.plot_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = plot_threads.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "plot_threads_update_own" ON public.plot_threads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = plot_threads.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "plot_threads_delete_own" ON public.plot_threads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = plot_threads.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

-- ============================================================
-- CHAPTERS
-- ============================================================

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_select_own" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = chapters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "chapters_insert_own" ON public.chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = chapters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "chapters_update_own" ON public.chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = chapters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "chapters_delete_own" ON public.chapters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = chapters.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

-- ============================================================
-- ARC SUMMARIES
-- ============================================================

ALTER TABLE public.arc_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arc_summaries_select_own" ON public.arc_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = arc_summaries.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "arc_summaries_insert_own" ON public.arc_summaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = arc_summaries.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "arc_summaries_update_own" ON public.arc_summaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = arc_summaries.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "arc_summaries_delete_own" ON public.arc_summaries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = arc_summaries.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

-- ============================================================
-- WORLD NOTES
-- ============================================================

ALTER TABLE public.world_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_notes_select_own" ON public.world_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = world_notes.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "world_notes_insert_own" ON public.world_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = world_notes.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "world_notes_update_own" ON public.world_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = world_notes.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "world_notes_delete_own" ON public.world_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = world_notes.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

-- ============================================================
-- CREATURE LORE
-- ============================================================

ALTER TABLE public.creature_lore ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creature_lore_select_own" ON public.creature_lore
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = creature_lore.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "creature_lore_insert_own" ON public.creature_lore
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = creature_lore.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "creature_lore_update_own" ON public.creature_lore
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = creature_lore.arc_id
        AND arcs.user_id = auth.uid()
    )
  );

CREATE POLICY "creature_lore_delete_own" ON public.creature_lore
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.arcs
      WHERE arcs.id = creature_lore.arc_id
        AND arcs.user_id = auth.uid()
    )
  );
