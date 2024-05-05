import toTag from '@deities/hephaestus/toTag.tsx';
import { useCallback } from 'react';

export default function useSetTags(
  setTags: (tags: ReadonlyArray<string>) => void,
) {
  return useCallback(
    (tags: ReadonlyArray<string>) =>
      setTags([...new Set(tags.slice(0, 16).map(toTag))]),
    [setTags],
  );
}
