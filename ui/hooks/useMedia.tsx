import { useEffect, useMemo, useState } from 'react';

export default function useMedia(query: string) {
  const media = useMemo(() => window.matchMedia(query), [query]);
  const [matches, setMatches] = useState(media?.matches);
  useEffect(() => {
    const listener = (event: { matches: boolean }) => {
      if (matches !== event.matches) {
        setMatches(event.matches);
      }
    };
    media?.addEventListener('change', listener);
    return () => media?.removeEventListener('change', listener);
  }, [query, media, matches]);
  return matches;
}
