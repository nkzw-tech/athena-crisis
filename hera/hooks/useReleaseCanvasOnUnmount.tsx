import { RefObject, useLayoutEffect, useRef } from 'react';
import releaseCanvas from '../lib/releaseCanvas.tsx';

// Frees the memory of on screen canvas when they are removed from the page
export default function useReleaseCanvasOnUnmount(
  ...refs: ReadonlyArray<RefObject<HTMLCanvasElement | null>>
) {
  const canvases = useRef<ReadonlyArray<HTMLCanvasElement | null>>([]);

  useLayoutEffect(() => {
    canvases.current = refs.map((ref) => ref.current);
  });

  useLayoutEffect(
    () => () => {
      const list = canvases.current;
      setTimeout(() => {
        for (const canvas of list) {
          if (canvas && !canvas.isConnected) {
            releaseCanvas(canvas);
          }
        }
      }, 0);
    },
    [],
  );
}
