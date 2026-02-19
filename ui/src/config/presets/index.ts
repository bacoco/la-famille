import { Agent } from '@/types/agent';
import { generateId } from '@/lib/utils';
import { mamanPreset } from './maman';
import { henryPreset } from './henry';
import { sagePreset } from './sage';
import { novaPreset } from './nova';
import { blaisePreset } from './blaise';
import { biblioPreset } from './biblio';

export { mamanPreset } from './maman';
export { henryPreset } from './henry';
export { sagePreset } from './sage';
export { novaPreset } from './nova';
export { blaisePreset } from './blaise';
export { biblioPreset } from './biblio';

const allPresets = [mamanPreset, henryPreset, sagePreset, novaPreset, blaisePreset, biblioPreset];

/**
 * Returns all preset agents as fully-formed Agent objects with generated IDs
 * and timestamps. Each call generates fresh IDs, so call once and cache the result.
 */
export function getPresetAgents(): Agent[] {
  const now = new Date().toISOString();

  return allPresets.map((preset) => ({
    ...preset,
    id: generateId('agent'),
    createdAt: now,
    updatedAt: now,
  }));
}
