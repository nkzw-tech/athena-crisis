import { useCallback, useEffect, useRef } from 'react';

export default function useColumns(
  selector = ':scope > :first-child > div',
): [(element: HTMLDivElement) => void, () => number | null] {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const columnRef = useRef<number | null>(null);
  useEffect(() => {
    const listener = () => {
      columnRef.current = null;
    };
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, []);

  const setRef = useCallback((element: HTMLDivElement) => {
    containerRef.current = element;
    columnRef.current = null;
  }, []);

  const getColumns = useCallback(() => {
    const element = containerRef.current;
    if (element && columnRef.current === null) {
      const elements = [...element.querySelectorAll<HTMLElement>(selector)];
      const initialOffset = elements[0]?.offsetTop || 0;
      columnRef.current = Math.max(
        1,
        elements.findIndex((element) => element.offsetTop > initialOffset),
      );
    }
    return columnRef.current;
  }, [selector]);

  return [setRef, getColumns];
}
