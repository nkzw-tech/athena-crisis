import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { ReactNode, useEffect, useSyncExternalStore } from 'react';
import { isIOS } from '../Browser.tsx';
import cssVar, { applyVar } from '../cssVar.tsx';

let div: HTMLDivElement | null = null;
const CACHE = new Map<string, number>();
export const MAX_SCALE = 3;

export const getScale = (tileSize: number) => {
  if (!div) {
    div = document.createElement('div');
  }

  const size = isIOS
    ? Math.max(window.screen.width, window.screen.height)
    : Math.max(window.innerWidth, window.innerHeight);
  const id = `${size}-$-${tileSize}`;
  if (CACHE.has(id)) {
    return CACHE.get(id)!;
  }
  Object.assign(div.style, {
    height: `${10 * tileSize}px`,
    pointerEvents: 'none',
    transform: applyVar('perspective-transform'),
    userSelect: 'none',
    visiblity: 'hidden',
    width: `${14 * tileSize}px`,
  });

  document.body.append(div);
  const { width } = div.getBoundingClientRect();
  div.remove();

  let maxScale = 1;
  for (let scale = MAX_SCALE; scale > 0; scale--) {
    if (size > width * scale) {
      maxScale = scale;
      break;
    }
  }
  CACHE.set(id, maxScale);
  return maxScale;
};

const subscribe = (listener: () => void) => {
  window.addEventListener('resize', listener);
  window.addEventListener('orientationchange', listener);
  return () => {
    window.removeEventListener('resize', listener);
    window.removeEventListener('orientationchange', listener);
  };
};

export default function useScale(tileSize: number) {
  return useSyncExternalStore(subscribe, () => getScale(tileSize));
}

export function ScaleContext({ children }: { children: ReactNode }) {
  const scale = useScale(TileSize);

  useEffect(() => {
    document.documentElement.style.setProperty(cssVar('scale'), String(scale));
  }, [scale]);

  return children;
}
