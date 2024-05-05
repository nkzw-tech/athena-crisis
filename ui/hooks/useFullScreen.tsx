import { useEffect, useState } from 'react';
import { App } from '../App.tsx';

export function useFullscreen() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const listener = () => rerender((value) => value + 1);
    document.addEventListener('fullscreenchange', listener);
    return () => document.removeEventListener('fullscreenchange', listener);
  }, []);
  return App.isFullscreen();
}
