import { DeterministicCareerAiProvider } from './deterministicCareerAiProvider.js';
import { LlmCareerAiProvider } from './llmCareerAiProvider.js';

export function createCareerAiProvider({ env = process.env, fetchImpl } = {}) {
  const provider = (env.AI_PROVIDER ?? 'deterministic').trim().toLowerCase();
  if (provider === 'deterministic') return new DeterministicCareerAiProvider();
  if (provider === 'llm') return new LlmCareerAiProvider({ env, fetchImpl });
  throw new Error('AI_PROVIDER must be deterministic or llm.');
}