import { useCallback, useRef, useState } from 'react';
import type { InputLayer } from './Input.tsx';
import useInput from './useInput.tsx';

export default function useAcceptNavigation(
  count: number,
  layer: InputLayer = 'menu',
  selected: number,
): [active: number, reset: () => void] {
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useInput(
    'accept',
    useCallback(() => {
      if (!timer.current && count > 0 && selected >= 0 && selected < count) {
        setActive(selected);
        timer.current = setTimeout(() => {
          setActive(-1);
          timer.current = null;
        }, 90);
      }
    }, [count, selected]),
    layer,
  );

  return [
    active,
    useCallback(() => {
      setActive(-1);
    }, []),
  ];
}
