import { existsSync } from 'node:fs';
import { join } from 'node:path';
import root from './root.ts';

const mappings = new Map([
  ['athena-crisis:audio', join(root, 'ui/Audio')],
  ['athena-crisis:asset-variants', join(root, 'art/Variants')],
  ['athena-crisis:images', join(root, 'hera/render/Images')],
] as const);

export default function createResolver(
  { forceRemoteAudio } = { forceRemoteAudio: false },
) {
  return {
    customResolver(id: string) {
      if (
        id === 'athena-crisis:audio' ||
        id === 'athena-crisis:asset-variants' ||
        id === 'athena-crisis:images'
      ) {
        const path = mappings.get(id);
        if (!path) {
          return null;
        }

        if (forceRemoteAudio && id === 'athena-crisis:audio') {
          return `${path}.tsx`;
        }

        const resolvedPath = `${path}.nkzw.tsx`;
        return existsSync(resolvedPath) ? resolvedPath : `${path}.tsx`;
      }
      return null;
    },
    find: /^athena-crisis:(audio|asset-variants|images)$/,
    replacement: 'athena-crisis:$1',
  } as const;
}
