import {
  hasPreparedPortraits,
  hasPreparedSprites,
  preparePortraits,
  prepareSprites,
} from '@deities/art/Sprites.tsx';
import { useLayoutEffect, useState } from 'react';

export function useSprites(type: 'portraits' | 'all') {
  const [hasSprites, setHasSprites] = useState(
    type === 'portraits' ? hasPreparedPortraits : hasPreparedSprites,
  );

  useLayoutEffect(() => {
    if (!hasSprites) {
      (type === 'portraits' ? preparePortraits : prepareSprites)()
        .then(() => setHasSprites(true))
        .catch(() => {});
    }
  }, [hasSprites, type]);

  return hasSprites;
}
