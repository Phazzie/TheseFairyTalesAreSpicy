import type { ArcContext, AssembledPrompt, GenerationInput } from '../types/index.js';
import { ContextOverflowError } from '../types/index.js';
import { creatureModule } from '../modules/creatureModule.js';
import { creatureLoreModule } from '../modules/creatureLoreModule.js';
import { arcContextModule } from '../modules/arcContextModule.js';
import { characterModule } from '../modules/characterModule.js';
import { relationshipModule } from '../modules/relationshipModule.js';
import { worldNotesModule } from '../modules/worldNotesModule.js';
import { atmosphereModule } from '../modules/atmosphereModule.js';
import { motifModule } from '../modules/motifModule.js';
import { voiceModule } from '../modules/voiceModule.js';
import { authorModule } from '../modules/authorModule.js';
import { perspectiveModule } from '../modules/perspectiveModule.js';
import { beatModule } from '../modules/beatModule.js';
import { pacingModule } from '../modules/pacingModule.js';
import { proseConstraintsModule } from '../modules/proseConstraintsModule.js';
import { spiceLevelModule } from '../modules/spiceLevelModule.js';
import { consentChemistryModule } from '../modules/consentChemistryModule.js';
import { speakerTagModule } from '../modules/speakerTagModule.js';
import { readingLevelModule } from '../modules/readingLevelModule.js';
import { genreBlendModule } from '../modules/genreBlendModule.js';

// Read the package version from package.json for engineVersion
import packageJson from '../../package.json' assert { type: 'json' };

const ENGINE_VERSION: string = (packageJson as { version: string }).version;

// Token budget estimation (1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const DEFAULT_MAX_BUDGET = 32000;

// Module priority for context overflow dropping
// These modules are NEVER dropped
const NEVER_DROP = new Set([
  'creatureModule',
  'beatModule',
  'spiceLevelModule',
  'perspectiveModule',
  'characterModule',
  'relationshipModule',
  'consentChemistryModule',
  'proseConstraintsModule',
  'speakerTagModule',
  'readingLevelModule',
]);

export function assembleSystemPrompt(
  input: GenerationInput,
  context: ArcContext,
  opts?: { maxTokenBudget?: number }
): AssembledPrompt {
  const maxBudget = opts?.maxTokenBudget ?? input.maxTokenBudget ?? DEFAULT_MAX_BUDGET;
  const droppedModules: string[] = [];

  // Run all modules in canonical order
  // The order matters — modules build on each other conceptually
  const moduleOutputs: { name: string; content: string; canDrop: boolean }[] = [
    { name: 'creatureModule', content: creatureModule(input, context), canDrop: false },
    { name: 'creatureLoreModule', content: creatureLoreModule(input, context), canDrop: true },
    { name: 'arcContextModule', content: arcContextModule(input, context), canDrop: false },
    { name: 'characterModule', content: characterModule(input, context), canDrop: false },
    { name: 'relationshipModule', content: relationshipModule(input, context), canDrop: false },
    { name: 'worldNotesModule', content: worldNotesModule(input, context), canDrop: true },
    { name: 'atmosphereModule', content: atmosphereModule(input, context), canDrop: true },
    { name: 'motifModule', content: motifModule(input, context), canDrop: true },
    { name: 'voiceModule', content: voiceModule(input, context), canDrop: false },
    { name: 'authorModule', content: authorModule(input, context), canDrop: false },
    { name: 'perspectiveModule', content: perspectiveModule(input, context), canDrop: false },
    { name: 'beatModule', content: beatModule(input, context), canDrop: false },
    { name: 'pacingModule', content: pacingModule(input, context), canDrop: false },
    { name: 'proseConstraintsModule', content: proseConstraintsModule(input, context), canDrop: false },
    { name: 'spiceLevelModule', content: spiceLevelModule(input, context), canDrop: false },
    { name: 'consentChemistryModule', content: consentChemistryModule(input, context), canDrop: false },
    { name: 'speakerTagModule', content: speakerTagModule(input, context), canDrop: false },
    { name: 'readingLevelModule', content: readingLevelModule(input, context), canDrop: false },
    { name: 'genreBlendModule', content: genreBlendModule(input, context), canDrop: true },
  ];

  // Suppress unused variable warning — NEVER_DROP is intentional documentation
  void NEVER_DROP;

  // Filter empty outputs
  let active = moduleOutputs.filter((m) => m.content.trim().length > 0);

  // Check total token budget
  let totalTokens = estimateTokens(active.map((m) => m.content).join('\n\n'));

  if (totalTokens > maxBudget) {
    // Drop in priority order: worldNotesModule first, then atmosphereModule, motifModule, genreBlendModule, creatureLoreModule
    const dropOrder = ['worldNotesModule', 'atmosphereModule', 'motifModule', 'genreBlendModule', 'creatureLoreModule'];

    for (const moduleName of dropOrder) {
      if (totalTokens <= maxBudget) break;
      const idx = active.findIndex((m) => m.name === moduleName && m.canDrop);
      if (idx !== -1) {
        droppedModules.push(moduleName);
        active = active.filter((m) => m.name !== moduleName);
        totalTokens = estimateTokens(active.map((m) => m.content).join('\n\n'));
      }
    }

    // If still over budget after all drops, truncate rolling summary
    if (totalTokens > maxBudget && context.rollingSummary) {
      const truncatedContext: ArcContext = {
        ...context,
        rollingSummary: {
          ...context.rollingSummary,
          summaryText: context.rollingSummary.summaryText.split(' ').slice(-75).join(' '),
        },
      };
      // Rebuild arcContextModule with truncated summary
      const idx = active.findIndex((m) => m.name === 'arcContextModule');
      if (idx !== -1) {
        active[idx] = {
          ...active[idx]!,
          content: arcContextModule(input, truncatedContext),
        };
        totalTokens = estimateTokens(active.map((m) => m.content).join('\n\n'));
        if (!droppedModules.includes('rollingSummaryTruncated')) {
          droppedModules.push('rollingSummaryTruncated');
        }
      }
    }

    // If STILL over budget, throw
    if (totalTokens > maxBudget) {
      throw new ContextOverflowError(
        `Assembled prompt (${totalTokens} tokens) exceeds budget (${maxBudget} tokens) even after dropping optional modules.`,
        droppedModules,
      );
    }
  }

  const prompt = active.map((m) => m.content).join('\n\n');

  return {
    prompt,
    engineVersion: ENGINE_VERSION,
    droppedModules,
  };
}
