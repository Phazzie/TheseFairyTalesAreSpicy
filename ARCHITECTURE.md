# Spicy Fairy Tales — Architecture Reference

## System Overview

A monorepo containing an AI-powered supernatural romance serial fiction generator.

```
spicy-fairy-tales/
├── packages/
│   ├── story-engine/   Pure TypeScript story generation logic (no framework deps)
│   └── api/            Hono.js API deployed as Vercel Edge Functions
└── apps/
    └── mobile/         Expo SDK 53 app (React Native + web)
```

## Data Flow

```
User taps "Generate" in app
  → apps/mobile/hooks/useGeneration.ts
  → lib/api.ts generateChapter() [SSE fetch]
  → packages/api/src/handlers/generate.ts [Vercel Edge]
    → db/continuityInjector.ts  (parallel Supabase fetches → ArcContext)
    → @story/engine assembleSystemPrompt()  (18 modules → prompt string)
    → clients/grok.ts generateStoryStreaming()  (xAI Grok API)
    → SSE stream → app [text chunks in real-time]
    → post-processors (strip tags, detect cliffhanger, measure dialogue ratio)
    → db/chapters.ts saveChapter()  (saves with full metadata)
    → ctx.waitUntil(generateRollingSummary())  [non-blocking background]
  → app receives 'complete' SSE event
  → TanStack Query invalidates ['chapters', arcId]
  → Library tab updates
```

## Packages

### @story/engine
- **Input:** `GenerationInput` + `ArcContext`
- **Output:** `AssembledPrompt` (`{ prompt, engineVersion, droppedModules }`)
- **No side effects.** Pure functions only. Can be tested in Node.js with no mocks.
- 19 prompt modules, 3 selectors, 6 processors
- Each module returns `''` if its context data is absent — never throws

### @story/api
- **Runtime:** Vercel Edge (`export const config = { runtime: 'edge' }` on generate/continue)
- **Auth:** Supabase JWT validated in `middleware/auth.ts`
- **DB:** `adminClient` (service key, bypasses RLS) for writes; user JWT forwarded for reads
- **AI:** `clients/grok.ts` (generation) + `clients/elevenlabs.ts` (audio, v1.1+)

### apps/mobile
- **Routing:** Expo Router (file-based)
- **State:** Zustand (UI/ephemeral) + TanStack Query (server data)
- **Auth:** Supabase Auth via `lib/supabase.ts`; session persisted in AsyncStorage
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)

## Key Architecture Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| API runtime | Vercel Edge | Streaming generation > 60s limit on serverless |
| Prompt versioning | Store full prompt per chapter | Cannot load prior engine versions at runtime |
| Rate limiting | Atomic Postgres function | Read-then-write is a race condition |
| Context overflow | Priority-ordered module dropping | Never drop character/beat/spice modules |
| Distribution | Play Store (L1-3) + Direct APK (all) | Play Store bans explicit content |

## Environment Variables

See `.env.example` for the complete list. Key rule:
- `EXPO_PUBLIC_*` → safe to bundle in app (Supabase URL, Anon key, API URL)
- Everything else → server-side only (Grok key, ElevenLabs key, Service key)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Set up Supabase
supabase start
supabase db reset   # runs all migrations + seed

# 3. Generate TypeScript types from DB schema
supabase gen types typescript --local > packages/api/src/db/database.types.ts

# 4. Copy env file and add your API keys
cp .env.example .env.local

# 5. Run the API locally
pnpm --filter @story/api dev

# 6. Run the Expo app
pnpm --filter spicy-fairy-tales-mobile start

# 7. Build Android APK for testing
eas build --profile preview --platform android
```

## Adding a New Prompt Module

1. Create `packages/story-engine/src/modules/myModule.ts`
2. Follow the module contract: `(input, context) => string`, return `''` on missing context
3. Import and add to the `moduleOutputs` array in `assembler/systemPrompt.ts`
4. Add to the barrel export in `src/index.ts`
5. Write tests in `src/__tests__/modules/myModule.test.ts`
6. Bump the minor version in `packages/story-engine/package.json`
