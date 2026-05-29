-- ============================================================
-- SPICY FAIRY TALES — DEVELOPMENT SEED DATA
-- seed.sql
-- ============================================================
-- NOTE: auth.users cannot be seeded directly via SQL in Supabase.
-- To use this seed:
--   1. Create a test user via the Supabase dashboard or the Auth API
--      (e.g. POST /auth/v1/signup with email dev@example.com / password)
--   2. Copy the resulting user UUID and replace ALL occurrences of
--      the placeholder UUID below:
--         '00000000-0000-0000-0000-000000000001'
--   3. Run: supabase db reset   (which applies migrations then this seed)
--
-- Placeholder user UUID: 00000000-0000-0000-0000-000000000001
-- ============================================================

-- ============================================================
-- STABLE SEED UUIDs
-- Using fixed UUIDs so the seed is idempotent and cross-referenceable.
-- ============================================================

-- User
-- 00000000-0000-0000-0000-000000000001  (dev user — must exist in auth.users first)

-- Arc
-- 00000000-0000-0000-0000-000000000010

-- Characters
-- 00000000-0000-0000-0000-000000000020  (Elena Vasile — protagonist)
-- 00000000-0000-0000-0000-000000000021  (Dorian Blackthorn — love interest)

-- Chapters
-- 00000000-0000-0000-0000-000000000030  (Chapter 1)
-- 00000000-0000-0000-0000-000000000031  (Chapter 2)

-- Plot threads
-- 00000000-0000-0000-0000-000000000040  (Chekhov: the silver locket)
-- 00000000-0000-0000-0000-000000000041  (Callback: the blood oath)

-- Relationship
-- 00000000-0000-0000-0000-000000000050

-- Creature lore
-- 00000000-0000-0000-0000-000000000060

-- World note
-- 00000000-0000-0000-0000-000000000070

-- ============================================================
-- PROFILE
-- ============================================================

INSERT INTO public.profiles (id, subscription_tier, monthly_generation_count, monthly_reset_date, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'pro',
  7,
  date_trunc('month', NOW()) + INTERVAL '1 month',
  NOW() - INTERVAL '14 days'
)
ON CONFLICT (id) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  monthly_generation_count = EXCLUDED.monthly_generation_count;

-- ============================================================
-- ARC: "Crimson Vow" — Quick-Start Vampire Arc
-- ============================================================

INSERT INTO public.arcs (
  id,
  user_id,
  title,
  creature_type,
  arc_type,
  themes,
  default_spice_level,
  pov_mode,
  tense,
  narrative_distance,
  reading_level,
  dialogue_ratio_pct,
  hook_density,
  pacing_rhythm,
  scene_count_default,
  atmosphere_archetype,
  default_sense_primary,
  default_sense_secondary,
  recurring_motif,
  genre_blend_primary,
  genre_blend_secondary,
  genre_blend_ratio,
  tone_allowance,
  is_quick_start,
  cover_image_url,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Crimson Vow',
  'vampire',
  'single_couple',
  ARRAY['forbidden love', 'class divide', 'hidden identity'],
  3,
  'third_limited',
  'past',
  'close',
  'commercial',
  45,
  'high',
  'propulsive',
  2,
  'gothic_manor',
  'visual',
  'olfactory',
  'blood-red roses that bloom out of season',
  'romance',
  'horror',
  75,
  'drifting',
  true,
  NULL,
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CHARACTERS
-- ============================================================

-- Elena Vasile — human librarian, protagonist
INSERT INTO public.characters (
  id,
  arc_id,
  slug,
  display_name,
  species,
  apparent_age,
  true_age,
  is_protagonist,
  accent_id,
  accent_region,
  emotion_state_ids,
  vocab_register,
  speech_avg_sentence_length,
  speech_verbal_tic,
  speech_signature_phrase,
  stated_desire,
  hidden_need,
  wound,
  flaw,
  lie,
  bio,
  appearance,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'elena-vasile',
  'Elena Vasile',
  'human',
  28,
  28,
  true,
  'ro-md',
  'Moldovan Romanian with faint British overlay',
  ARRAY['curious', 'guarded', 'yearning'],
  'formal',
  'medium',
  'She touches her collarbone when lying',
  'Books do not lie the way people do.',
  'To catalogue the ancient vampire library at Blackthorn Hall and publish her research',
  'To be truly seen by someone who will not leave when they discover how strange she is',
  'Her mother vanished when Elena was nine; a vampire she loved took her — Elena has never told anyone she suspects the supernatural is real',
  'She intellectualises emotion until it is too late to act on it',
  'She believes she is better off alone — that love is a distraction scholars cannot afford',
  'Elena Vasile grew up in Iași, Romania, raised by her grandmother after her mother disappeared. She won a scholarship to Oxford, completed a doctorate in rare manuscript conservation, and now works as a specialist acquisitions librarian in Edinburgh. She was hired to catalogue the Blackthorn estate library under a six-week contract — a commission she cannot afford to refuse, even after the first night reveals things that cannot be explained by natural light.',
  'Tall and lean with dark chestnut hair she keeps in a loose braid that is always threatening to fall apart. Deep-set amber eyes behind wire-rimmed glasses. Ink stains on her right index finger and middle finger, always. She dresses in layers — high-necked blouses, wide-leg trousers, a long cardigan she wears like armour — and smells faintly of cedarwood and old paper.',
  NOW() - INTERVAL '12 days'
)
ON CONFLICT (id) DO NOTHING;

-- Dorian Blackthorn — vampire, love interest / antagonist
INSERT INTO public.characters (
  id,
  arc_id,
  slug,
  display_name,
  species,
  apparent_age,
  true_age,
  is_protagonist,
  accent_id,
  accent_region,
  emotion_state_ids,
  vocab_register,
  speech_avg_sentence_length,
  speech_verbal_tic,
  speech_signature_phrase,
  stated_desire,
  hidden_need,
  wound,
  flaw,
  lie,
  bio,
  appearance,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000010',
  'dorian-blackthorn',
  'Dorian Blackthorn',
  'vampire',
  35,
  412,
  false,
  'en-gb-rp',
  'Received Pronunciation with occasional archaic vowel shifts',
  ARRAY['controlled', 'hungry', 'lonely'],
  'archaic',
  'long',
  'A single pause before he speaks — always — as though choosing which version of the truth to offer',
  'Everything of value has a price. The only question is who pays it.',
  'To protect his bloodline''s ancient secrets from the vampire council that wants them destroyed',
  'To be forgiven — by himself, for the lives he has taken across four centuries',
  'He turned Elena''s mother into a vampire in 1998 at her own desperate request; he has spent twenty-six years watching Elena from a distance, guilt-stricken and unable to confess',
  'He controls everyone around him before he can be hurt by them — mistaking dominance for safety',
  'He tells himself he hired Elena for her expertise. The lie is that he hired her so he could finally see her face in the same room as his.',
  'Dorian was turned in 1613 in Prague by a vampire noblewoman who wanted a spy with a scholar''s mind. He accumulated wealth across centuries through land, banking, and the kind of careful patience only immortality allows. He built Blackthorn Hall in 1842 on the Scottish Borders, filling its library with texts the Council had ordered burned. He rules his territory with surgical precision and is known among vampires for his refusal to sire new vampires — a vow broken only once, for a Romanian woman who was dying and begged him for more time.',
  'Absurdly beautiful in a way that reads as wrong — too symmetrical, too still. Black hair worn swept back, sharp jaw, eyes so dark brown they appear black except in direct candlelight where they are the colour of old amber. He wears bespoke clothing from decades past tailored to current cuts. Always a signet ring on his left hand: onyx, engraved with a thorn. He smells of cold stone, black pepper, and something darker — iron or rain before a storm.',
  NOW() - INTERVAL '12 days'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CREATURE LORE
-- ============================================================

INSERT INTO public.creature_lore (
  id,
  arc_id,
  creature_type,
  rules,
  weaknesses,
  abilities,
  society_notes,
  custom_fields
)
VALUES (
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000010',
  'vampire',
  ARRAY[
    'Cannot enter a private dwelling without an explicit verbal invitation from the current occupant',
    'Must feed at minimum once per lunar cycle or begin to lose control of compulsion abilities',
    'A blood oath — both parties cutting and pressing wounds together — creates a permanent psychic tether that cannot be severed without death',
    'Vampires do not appear in mirrors but cast faint shadows; most humans rationalise this away',
    'Siring requires the human to willingly drink vampire blood after near-death; it cannot be forced'
  ],
  ARRAY[
    'Sunlight causes accelerating tissue damage — older vampires can tolerate minutes, young ones seconds',
    'Rowan wood through the heart causes paralysis, not death; ash wood through the heart causes true death',
    'Running water above knee-height creates a psychic barrier — crossing it requires sustained will and causes pain',
    'The sound of church bells within fifty metres disrupts compulsion abilities temporarily'
  ],
  ARRAY[
    'Compulsion: sustained eye contact allows implanting suggestions or erasing short-term memory',
    'Enhanced strength and speed scaling with age — Dorian can lift a car and move faster than human vision tracks',
    'Blood-sense: can detect a person''s emotional state, general health, and whether they have been fed on before via scent',
    'Accelerated healing of all wounds except rowan and ash',
    'Psychic tether post-blood-oath: sense the bonded person''s strong emotions across any distance'
  ],
  'The Covenant is the governing body of European vampires — twelve elders, seat in Vienna. They enforce secrecy, arbitrate territorial disputes, and maintain a Registry of all sired vampires. Dorian sits on the outer council as an advisor but has refused a seat of power for two centuries. Rogue vampires who expose the species are hunted by Covenant Blades, a specialist enforcement unit. The Covenant is aware of Blackthorn Hall''s library and has twice demanded Dorian surrender certain texts — twice he has refused, and twice they have decided he is too powerful and too useful to destroy over books.',
  '{
    "blood_oath_lore": "A blood oath is considered the most sacred and most dangerous act in vampire society — more binding than marriage, more permanent than law. The Council prohibits them except between a vampire and their sire. Dorian knows of one unsanctioned oath in the historical record. The penalty, if discovered, is true death for both parties.",
    "the_registry": "Every sired vampire must be reported to the Covenant Registry within one lunar cycle of the turning. Dorian never registered Elena''s mother. Her file in the Registry reads: deceased, 1998, Edinburgh. The lie has held for twenty-six years."
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RELATIONSHIP MAP
-- ============================================================

INSERT INTO public.relationship_map (
  id,
  arc_id,
  character_a_id,
  character_b_id,
  power_holder,
  tension_type,
  history,
  current_dynamic
)
VALUES (
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000020',  -- Elena (a)
  '00000000-0000-0000-0000-000000000021',  -- Dorian (b)
  'b',
  'romantic',
  'Dorian turned Elena''s mother Mara in 1998 and has watched Elena from a distance for her entire adult life, never making contact. Elena knows nothing of this. They have spoken exactly once before the arc begins — a brief exchange in an Edinburgh auction house three years prior, which Dorian engineered and Elena dismissed as a forgettable encounter with an insufferably attractive man who bid against her for a seventeenth-century bestiary.',
  'Employer and contracted employee — a power imbalance Dorian constructed deliberately to keep Elena in the house long enough for her to trust him. Elena finds him infuriating, compelling, and almost certainly hiding something. Dorian is discovering that watching someone and actually knowing them are entirely different things, and that Elena is far harder to manage than he anticipated.'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CHAPTERS
-- ============================================================

-- Chapter 1: The Invitation
INSERT INTO public.chapters (
  id,
  arc_id,
  chapter_number,
  title,
  content,
  word_count,
  beat_used,
  emotional_arc,
  dialogue_ratio_pct,
  chekhov_seeded,
  cliffhanger_type,
  spice_level_used,
  engine_version,
  status,
  generation_attempt,
  parent_chapter_id,
  dropped_modules,
  system_prompt_used,
  archived_at,
  generated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000010',
  1,
  'The Invitation',
  E'The letter arrived on a Tuesday, which Elena had always considered the least trustworthy day of the week.\n\nIt was the paper that made her pause before opening it — heavy cream stock with a faint watermark of a thorned vine, the kind of stationery that announced money so old it had forgotten being new. Her name was written in a hand she did not recognise: precise, slightly archaic in its letterforms, the capital E of "Elena" curled at the top in a way she had only ever seen in manuscripts pre-dating the Civil War.\n\nShe slit the envelope with her letter knife — a habit her grandmother called unnecessary and her colleagues called affectation — and read.\n\n*Miss Vasile,*\n\n*You catalogued three volumes from the Ashworth collection at Sotheby''s Edinburgh in 2021. Your assessment of the Blackwood marginalia was, in the opinion of those who noticed, the only accurate one offered that day.*\n\n*I have a library. It requires attention that I cannot give it and that most specialists could not survive giving it. I am told you are different.*\n\n*Six weeks. Your current annual salary, in full, as the fee. Travel and accommodation provided. You may refuse. I would not blame you.*\n\n*—D. Blackthorn*\n\n*P.S. The access road is impassable after the first heavy frost. I mention this not as a threat but as relevant information regarding the timing of your decision.*\n\nElena read it twice. Then she looked out her office window at the Edinburgh drizzle, at the three grant applications on her desk that were almost certainly going to be rejected, at the damp patch in the corner of the ceiling that Facilities had been meaning to address since before she arrived.\n\nShe picked up her phone and called the number at the bottom of the letter.\n\nHe answered on the first ring, which should not have surprised her but did.\n\n"Miss Vasile." Not a question. He had known it would be her.\n\n"Mr. Blackthorn." She kept her voice neutral with some effort. "Your postscript was somewhat ominous."\n\n"It was a weather report."\n\n"It read like a warning."\n\n"Then perhaps," he said, "you should treat it as one."\n\nShe was quiet for a moment. Through the phone she could hear almost nothing — no background noise, no breath, no ambient hum of appliance or traffic. The silence on his end was the most complete she had ever encountered.\n\n"The Blackwood marginalia," she said. "How did you know what I wrote? That assessment was private."\n\n"Very little is as private as people believe," he said. "Will you come?"\n\nShe looked at the ceiling damp again.\n\n"Send me the address," she said. "I''ll drive up Saturday."\n\nThe line went dead before she finished the sentence.',
  412,
  'inciting_incident',
  'curiosity > unease > resolve',
  38,
  ARRAY['silver locket', 'the unreachable silence on the phone'],
  'question',
  1,
  '1.0.0',
  'published',
  1,
  NULL,
  '{}',
  NULL,
  NULL,
  NOW() - INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;

-- Chapter 2: Blackthorn Hall
INSERT INTO public.chapters (
  id,
  arc_id,
  chapter_number,
  title,
  content,
  word_count,
  beat_used,
  emotional_arc,
  dialogue_ratio_pct,
  chekhov_seeded,
  cliffhanger_type,
  spice_level_used,
  engine_version,
  status,
  generation_attempt,
  parent_chapter_id,
  dropped_modules,
  system_prompt_used,
  archived_at,
  generated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000010',
  2,
  'Blackthorn Hall',
  E'The access road was not impassable. It was, however, attempting to be.\n\nElena''s hire car — a sensible hatchback that the rental company had insisted was appropriate for Scottish terrain and which was proving them liars — crawled the final two miles of unpaved track in second gear, headlights cutting through the kind of November dark that felt intentional. The sat-nav had given up thirty minutes ago. She was navigating by the map she had printed and by the certainty that the track only went one direction.\n\nBlackthorn Hall appeared at the top of a rise, and she stopped the car.\n\nShe had looked it up, of course. The listing records placed the original structure in the 1640s, substantially rebuilt in 1842, privately held since. The photographs she''d found were few and poor quality: a distant shot from what appeared to be a century-old county survey, a grainy scan of a Victorian postcard. The real thing was different from all of them in a way she could not immediately articulate.\n\nIt was not the size, though it was large — three storeys, a central block and two wings, dressed stone the colour of charcoal. It was not the setting, though the moors behind it were genuinely Gothic in the literary sense. It was something about the windows. Every window on the upper two floors was dark. The ground floor, the left wing, burned with amber light.\n\nSomebody was waiting up.\n\nShe drove the rest of the way.\n\nHe opened the door before she knocked, which she had half expected.\n\nWhat she had not expected was the way he looked at her — not the way people look at strangers, assessing, categorising. The way he looked at her was the way she looked at a manuscript she had been searching for for years. Like recognition. Like relief barely contained by manners.\n\nIt lasted less than a second. Then the expression was gone and he was simply a very still man in a very good suit standing in the doorway of a very large house.\n\n"You made good time," he said.\n\n"Your postscript was motivating." She looked past him into the entrance hall. High ceilings, flagstone floor, a chandelier that held actual candles — all of them lit, which was either aesthetic commitment or a power issue. A staircase that curved upward into shadow. And from somewhere beyond the nearest archway, the smell she had been half hoping for and had not let herself believe in until this moment: old paper, vellum, the particular dry sweetness of books that had been given enough space to breathe for long enough that they had become a climate unto themselves.\n\nShe looked back at him.\n\n"How many volumes?" she asked.\n\nFor the first time, something in his face shifted in a way that was not controlled.\n\n"We haven''t counted," he said. "That''s rather why you''re here."\n\nShe stepped across the threshold.\n\nThe roses on the hall table were red — deep arterial red — and blooming. In November. In Scotland. She filed this away under *things to consider later* and followed Dorian Blackthorn toward the smell of his library.',
  468,
  'new_world',
  'wariness > awe > intrigued unease',
  32,
  ARRAY['candles lit in an unoccupied house', 'the blood-red roses blooming in November'],
  'revelation',
  2,
  '1.0.0',
  'published',
  1,
  NULL,
  '{}',
  NULL,
  NULL,
  NOW() - INTERVAL '8 days'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PLOT THREADS
-- ============================================================

-- Thread 1: Chekhov — Elena's silver locket
INSERT INTO public.plot_threads (
  id,
  arc_id,
  thread_type,
  description,
  planted_in_chapter,
  expected_payoff_chapter,
  status,
  resolved_in_chapter,
  resolution_note,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  'chekhov',
  'Elena wears a silver locket her grandmother gave her on the day her mother disappeared — inside is a small photograph of a woman Dorian will recognise instantly as Mara Vasile, the woman he turned in 1998. The locket has a faint bloodstain on the inside of the clasp that Elena has always assumed was rust. It is not rust. When Dorian finally sees the locket in close detail (expected around chapter 7-8), it will trigger the central revelation: he knew her mother.',
  1,
  8,
  'open',
  NULL,
  NULL,
  NOW() - INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;

-- Thread 2: Callback — the blood oath clause
INSERT INTO public.plot_threads (
  id,
  arc_id,
  thread_type,
  description,
  planted_in_chapter,
  expected_payoff_chapter,
  status,
  resolved_in_chapter,
  resolution_note,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000041',
  '00000000-0000-0000-0000-000000000010',
  'callback',
  'In chapter 2 Elena cuts her hand on a broken glass in the library and Dorian reacts with inhuman speed and deliberate stillness — catching her hand, holding it for a beat too long. He does not explain the pause. The callback fires in chapter 9-10 when the nature of blood oaths is explained and Elena recalls this moment, realising he was fighting the compulsion to feed and that his restraint was an active, costly choice rather than indifference.',
  2,
  9,
  'open',
  NULL,
  NULL,
  NOW() - INTERVAL '8 days'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WORLD NOTE
-- ============================================================

INSERT INTO public.world_notes (
  id,
  arc_id,
  category,
  content,
  is_active,
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000070',
  '00000000-0000-0000-0000-000000000010',
  'rule',
  'Blackthorn Hall has been Elena''s invitation zone since she crossed the threshold in chapter 2. Dorian''s standing invitation to her is verbal and unwitnessed. Under vampire law this means it can be revoked by either party, but revocation by the owner (Dorian) in his own home would also sever the psychic thread the Hall has begun to build around her — an effect of prolonged human habitation in a vampire-anchored space. He cannot expel her without losing his early-warning sense of her presence in the building. He has not told her any of this.',
  true,
  NOW() - INTERVAL '8 days'
)
ON CONFLICT (id) DO NOTHING;
