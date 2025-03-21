import useScale, { MAX_SCALE } from '@deities/ui/hooks/useScale.tsx';
import scrollToCenter from '@deities/ui/lib/scrollToCenter.tsx';
import { getCurrentScrollContainer } from '@deities/ui/ScrollContainer.tsx';
import parseInteger from '@nkzw/core/parseInteger.js';
import { useCallback, useEffect, useRef, useState } from 'react';

const getKey = (key: string) => `::AC::zoom::${key}`;

export type SetZoomFn = (value: number | ((value: number) => number)) => void;

export default function useZoom(
  max?: number,
  key?: string,
  scrollIntoView: boolean = true,
): [zoom: number, setZoom: SetZoomFn] {
  const scale = useScale();

  const [zoom, _setZoom] = useState(() => {
    if (key) {
      const currentZoom = parseInteger(localStorage.getItem(getKey(key)) || '');
      if (
        currentZoom != null &&
        currentZoom >= 1 &&
        currentZoom <= (max || MAX_SCALE)
      ) {
        return currentZoom;
      }
    }

    return scale;
  });

  const setZoom: SetZoomFn = useCallback(
    (value) =>
      _setZoom((currentZoom) => {
        const zoom = typeof value === 'function' ? value(currentZoom) : value;
        if (key) {
          localStorage.setItem(getKey(key), String(zoom));
        }
        return zoom;
      }),

    [key],
  );

  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) {
      setZoom(scale);
    } else {
      mounted.current = true;
    }
  }, [scale, setZoom]);

  useEffect(() => {
    if (scrollIntoView) {
      scrollToCenter(getCurrentScrollContainer());
    }
  }, [scrollIntoView, zoom]);

  return [zoom, setZoom];
}
