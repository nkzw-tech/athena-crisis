import { useCallback, useEffect, useMemo, useState } from 'react';
import { App } from '../App.tsx';

function useFullscreenState() {
  const [isFullscreen, setIsFullscreen] = useState(() => App.isFullscreen());
  useEffect(() => {
    const listener = () => setIsFullscreen(App.isFullscreen());
    document.addEventListener('fullscreenchange', listener);
    listener();
    return () => document.removeEventListener('fullscreenchange', listener);
  }, []);
  return [isFullscreen, setIsFullscreen] as const;
}

export function useFullscreen() {
  const [isFullscreen] = useFullscreenState();
  return isFullscreen;
}

export function useFullscreenControls() {
  const [isFullscreen, setIsFullscreen] = useFullscreenState();
  const canToggleFullscreen = useMemo(() => App.canToggleFullScreen(), []);
  const toggleFullscreen = useCallback(() => {
    if (canToggleFullscreen) {
      App.toggleFullscreen();
      setIsFullscreen(App.isFullscreen());
      requestAnimationFrame(() => setIsFullscreen(App.isFullscreen()));
    }
  }, [canToggleFullscreen, setIsFullscreen]);

  return {
    canToggleFullscreen,
    isFullscreen,
    toggleFullscreen,
  };
}

export function useFullscreenKeyboardShortcut(toggleFullscreen: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled, toggleFullscreen]);
}
