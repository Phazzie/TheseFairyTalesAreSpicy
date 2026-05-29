import type { ArcContext, GenerationInput } from '../types/index.js';

const CONSENT_CHEMISTRY_CONTENT =
  'All intimate escalation must be earned through chemistry, not assumed. Both parties actively participate. Desire is shown through action and subtext — never stated directly. Physical intimacy should feel like an inevitability that surprises both characters.';

export function consentChemistryModule(input: GenerationInput, context: ArcContext): string {
  return `CONSENT & CHEMISTRY:\n${CONSENT_CHEMISTRY_CONTENT}`;
}
