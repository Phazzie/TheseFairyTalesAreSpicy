// AUTO-GENERATED — do not edit manually
// Regenerate with: supabase gen types typescript --local

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          subscription_tier: 'free' | 'pro';
          monthly_generation_count: number;
          monthly_reset_date: string;
          created_at: string;
        };
        Insert: {
          id: string;
          subscription_tier?: 'free' | 'pro';
          monthly_generation_count?: number;
          monthly_reset_date?: string;
          created_at?: string;
        };
        Update: {
          subscription_tier?: 'free' | 'pro';
          monthly_generation_count?: number;
          monthly_reset_date?: string;
        };
      };
      arcs: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          creature_type: 'vampire' | 'werewolf' | 'fairy';
          arc_type: 'single_couple' | 'anthology' | 'multi_protagonist';
          themes: string[];
          default_spice_level: number;
          pov_mode: 'first_person' | 'third_limited' | 'third_omniscient' | 'rotating';
          tense: 'past' | 'present';
          narrative_distance: 'close' | 'cinematic';
          reading_level: 'accessible' | 'commercial' | 'elevated' | 'archaic';
          dialogue_ratio_pct: number;
          hook_density: 'low' | 'medium' | 'high';
          pacing_rhythm: 'slow_burn' | 'propulsive' | 'variable';
          scene_count_default: number;
          atmosphere_archetype: string;
          default_sense_primary: 'visual' | 'tactile' | 'auditory' | 'olfactory';
          default_sense_secondary: 'visual' | 'tactile' | 'auditory' | 'olfactory';
          recurring_motif: string | null;
          genre_blend_primary: 'romance' | 'horror' | 'mystery' | 'thriller' | 'fantasy';
          genre_blend_secondary: 'romance' | 'horror' | 'mystery' | 'thriller' | 'fantasy' | null;
          genre_blend_ratio: number;
          tone_allowance: 'locked' | 'drifting';
          is_quick_start: boolean;
          cover_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['arcs']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['arcs']['Insert']>;
      };
      characters: {
        Row: {
          id: string;
          arc_id: string;
          slug: string;
          display_name: string;
          species: 'human' | 'vampire' | 'werewolf' | 'fairy';
          apparent_age: number | null;
          true_age: number | null;
          is_protagonist: boolean;
          accent_id: string | null;
          accent_region: string | null;
          emotion_state_ids: string[];
          vocab_register: 'archaic' | 'formal' | 'neutral' | 'colloquial' | 'vulgar';
          speech_avg_sentence_length: 'short' | 'medium' | 'long' | null;
          speech_verbal_tic: string | null;
          speech_signature_phrase: string | null;
          stated_desire: string | null;
          hidden_need: string | null;
          wound: string | null;
          flaw: string | null;
          lie: string | null;
          bio: string;
          appearance: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['characters']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['characters']['Insert']>;
      };
      chapters: {
        Row: {
          id: string;
          arc_id: string;
          chapter_number: number;
          title: string | null;
          content: string;
          word_count: number;
          beat_used: string;
          emotional_arc: string;
          dialogue_ratio_pct: number;
          chekhov_seeded: string[];
          cliffhanger_type: string;
          spice_level_used: number;
          engine_version: string;
          status: 'published' | 'draft' | 'archived';
          generation_attempt: number;
          parent_chapter_id: string | null;
          dropped_modules: string[];
          system_prompt_used: string | null;
          archived_at: string | null;
          generated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chapters']['Row'], 'id' | 'generated_at'> & {
          id?: string;
          generated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>;
      };
      plot_threads: {
        Row: {
          id: string;
          arc_id: string;
          thread_type: 'chekhov' | 'callback' | 'dramatic_irony';
          description: string;
          planted_in_chapter: number;
          expected_payoff_chapter: number | null;
          status: 'open' | 'resolved' | 'abandoned';
          resolved_in_chapter: number | null;
          resolution_note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['plot_threads']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['plot_threads']['Insert']>;
      };
      arc_summaries: {
        Row: {
          id: string;
          arc_id: string;
          chapter_milestone: number;
          summary_text: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['arc_summaries']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['arc_summaries']['Insert']>;
      };
      world_notes: {
        Row: {
          id: string;
          arc_id: string;
          category: 'lore' | 'setting' | 'rule' | 'foreshadowing' | 'character_detail';
          content: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['world_notes']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['world_notes']['Insert']>;
      };
      creature_lore: {
        Row: {
          id: string;
          arc_id: string;
          creature_type: 'vampire' | 'werewolf' | 'fairy';
          rules: string[];
          weaknesses: string[];
          abilities: string[];
          society_notes: string;
          custom_fields: Json;
        };
        Insert: Omit<Database['public']['Tables']['creature_lore']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['creature_lore']['Insert']>;
      };
      relationship_map: {
        Row: {
          id: string;
          arc_id: string;
          character_a_id: string;
          character_b_id: string;
          power_holder: 'a' | 'b' | 'equal';
          tension_type: 'romantic' | 'adversarial' | 'mentor' | 'rival' | 'ambiguous';
          history: string;
          current_dynamic: string;
        };
        Insert: Omit<Database['public']['Tables']['relationship_map']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['relationship_map']['Insert']>;
      };
    };
    Functions: {
      owns_arc: {
        Args: { p_arc: string };
        Returns: boolean;
      };
      increment_generation_count: {
        Args: { p_user_id: string; p_limit: number };
        Returns: boolean;
      };
    };
  };
}
