-- ============================================================
-- SPICY FAIRY TALES — INITIAL SCHEMA
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION owns_arc(p_arc UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.arcs WHERE id = p_arc AND user_id = auth.uid())
$$;

-- ============================================================
-- PROFILES (subscription tier + usage tracking)
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro')),
  monthly_generation_count INT NOT NULL DEFAULT 0,
  monthly_reset_date TIMESTAMPTZ NOT NULL DEFAULT
    date_trunc('month', NOW()) + INTERVAL '1 month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_on_signup();

-- ============================================================
-- DB FUNCTIONS
-- ============================================================

-- Atomic generation count increment with limit check
CREATE OR REPLACE FUNCTION public.increment_generation_count(
  p_user_id UUID,
  p_limit INT
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE public.profiles
  SET monthly_generation_count = monthly_generation_count + 1
  WHERE id = p_user_id
    AND (p_limit = -1 OR monthly_generation_count < p_limit);
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;

-- ============================================================
-- ARCS
-- ============================================================

CREATE TABLE public.arcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  creature_type TEXT NOT NULL CHECK (creature_type IN ('vampire', 'werewolf', 'fairy')),
  arc_type TEXT NOT NULL DEFAULT 'single_couple'
    CHECK (arc_type IN ('single_couple', 'anthology', 'multi_protagonist')),
  themes TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(themes, 1) BETWEEN 1 AND 5),
  default_spice_level SMALLINT NOT NULL DEFAULT 2 CHECK (default_spice_level BETWEEN 1 AND 5),
  pov_mode TEXT NOT NULL DEFAULT 'third_limited'
    CHECK (pov_mode IN ('first_person', 'third_limited', 'third_omniscient', 'rotating')),
  tense TEXT NOT NULL DEFAULT 'past' CHECK (tense IN ('past', 'present')),
  narrative_distance TEXT NOT NULL DEFAULT 'close'
    CHECK (narrative_distance IN ('close', 'cinematic')),
  reading_level TEXT NOT NULL DEFAULT 'accessible'
    CHECK (reading_level IN ('accessible', 'commercial', 'elevated', 'archaic')),
  dialogue_ratio_pct SMALLINT NOT NULL DEFAULT 40 CHECK (dialogue_ratio_pct BETWEEN 10 AND 90),
  hook_density TEXT NOT NULL DEFAULT 'medium'
    CHECK (hook_density IN ('low', 'medium', 'high')),
  pacing_rhythm TEXT NOT NULL DEFAULT 'propulsive'
    CHECK (pacing_rhythm IN ('slow_burn', 'propulsive', 'variable')),
  scene_count_default SMALLINT NOT NULL DEFAULT 1 CHECK (scene_count_default BETWEEN 1 AND 3),
  atmosphere_archetype TEXT NOT NULL DEFAULT 'contemporary_urban',
  default_sense_primary TEXT NOT NULL DEFAULT 'visual'
    CHECK (default_sense_primary IN ('visual', 'tactile', 'auditory', 'olfactory')),
  default_sense_secondary TEXT NOT NULL DEFAULT 'tactile'
    CHECK (default_sense_secondary IN ('visual', 'tactile', 'auditory', 'olfactory')),
  recurring_motif TEXT,
  genre_blend_primary TEXT NOT NULL DEFAULT 'romance'
    CHECK (genre_blend_primary IN ('romance', 'horror', 'mystery', 'thriller', 'fantasy')),
  genre_blend_secondary TEXT
    CHECK (genre_blend_secondary IN ('romance', 'horror', 'mystery', 'thriller', 'fantasy')),
  genre_blend_ratio SMALLINT NOT NULL DEFAULT 80 CHECK (genre_blend_ratio BETWEEN 50 AND 100),
  tone_allowance TEXT NOT NULL DEFAULT 'locked'
    CHECK (tone_allowance IN ('locked', 'drifting')),
  is_quick_start BOOLEAN NOT NULL DEFAULT false,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT senses_differ CHECK (default_sense_primary <> default_sense_secondary)
);

-- ============================================================
-- CHARACTERS
-- ============================================================

CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  species TEXT NOT NULL DEFAULT 'human'
    CHECK (species IN ('human', 'vampire', 'werewolf', 'fairy')),
  apparent_age SMALLINT,
  true_age SMALLINT,
  is_protagonist BOOLEAN NOT NULL DEFAULT false,
  accent_id TEXT,
  accent_region TEXT,
  emotion_state_ids TEXT[] DEFAULT '{}',
  vocab_register TEXT NOT NULL DEFAULT 'neutral'
    CHECK (vocab_register IN ('archaic', 'formal', 'neutral', 'colloquial', 'vulgar')),
  speech_avg_sentence_length TEXT DEFAULT 'medium'
    CHECK (speech_avg_sentence_length IN ('short', 'medium', 'long')),
  speech_verbal_tic TEXT,
  speech_signature_phrase TEXT,
  stated_desire TEXT,
  hidden_need TEXT,
  wound TEXT,
  flaw TEXT,
  lie TEXT,
  bio TEXT NOT NULL DEFAULT '',
  appearance TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (arc_id, slug)
);

-- ============================================================
-- RELATIONSHIP MAP
-- ============================================================

CREATE TABLE public.relationship_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  character_a_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  character_b_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  power_holder TEXT NOT NULL DEFAULT 'equal'
    CHECK (power_holder IN ('a', 'b', 'equal')),
  tension_type TEXT NOT NULL DEFAULT 'romantic'
    CHECK (tension_type IN ('romantic', 'adversarial', 'mentor', 'rival', 'ambiguous')),
  history TEXT NOT NULL DEFAULT '',
  current_dynamic TEXT NOT NULL DEFAULT '',
  UNIQUE (arc_id, character_a_id, character_b_id)
);

-- ============================================================
-- PLOT THREADS
-- ============================================================

CREATE TABLE public.plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  thread_type TEXT NOT NULL DEFAULT 'chekhov'
    CHECK (thread_type IN ('chekhov', 'callback', 'dramatic_irony')),
  description TEXT NOT NULL,
  planted_in_chapter SMALLINT NOT NULL,
  expected_payoff_chapter SMALLINT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'abandoned')),
  resolved_in_chapter SMALLINT,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CHAPTERS
-- ============================================================

CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  chapter_number SMALLINT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  word_count INT NOT NULL DEFAULT 0,
  beat_used TEXT NOT NULL DEFAULT '',
  emotional_arc TEXT NOT NULL DEFAULT '',
  dialogue_ratio_pct SMALLINT NOT NULL DEFAULT 0,
  chekhov_seeded TEXT[] DEFAULT '{}',
  cliffhanger_type TEXT NOT NULL DEFAULT 'none',
  spice_level_used SMALLINT NOT NULL DEFAULT 2 CHECK (spice_level_used BETWEEN 1 AND 5),
  engine_version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('published', 'draft', 'archived')),
  generation_attempt SMALLINT NOT NULL DEFAULT 1,
  parent_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  dropped_modules TEXT[] DEFAULT '{}',
  system_prompt_used TEXT,
  archived_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index: only one published chapter per (arc, chapter_number)
CREATE UNIQUE INDEX chapters_one_published_per_number
  ON public.chapters (arc_id, chapter_number)
  WHERE status = 'published';

-- ============================================================
-- ARC SUMMARIES
-- ============================================================

CREATE TABLE public.arc_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  chapter_milestone SMALLINT NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (arc_id, chapter_milestone)
);

-- ============================================================
-- WORLD NOTES
-- ============================================================

CREATE TABLE public.world_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'lore'
    CHECK (category IN ('lore', 'setting', 'rule', 'foreshadowing', 'character_detail')),
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CREATURE LORE
-- ============================================================

CREATE TABLE public.creature_lore (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arc_id UUID NOT NULL REFERENCES public.arcs(id) ON DELETE CASCADE,
  creature_type TEXT NOT NULL CHECK (creature_type IN ('vampire', 'werewolf', 'fairy')),
  rules TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  abilities TEXT[] DEFAULT '{}',
  society_notes TEXT DEFAULT '',
  custom_fields JSONB DEFAULT '{}',
  UNIQUE (arc_id)
);
