import { useEffect, useState } from 'react';

export default function useVisibilityState(
  onVisibilityChange?: (isVisible: boolean) => void,
) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const onChange = () => {
      const newState = document.visibilityState !== 'hidden';
      if (newState !== isVisible) {
        onVisibilityChange?.(newState);
        setIsVisible(newState);
      }
    };
    const setVisible = () => setIsVisible(true);
    if (document.visibilityState === 'hidden') {
      // When the computer goes to sleep, sometimes the visibilitychange event is not fired.
      // In that case, we can use `mouseenter` or `keydown` to detect when the window is focused.
      document.addEventListener('mousemove', setVisible);
      document.addEventListener('keydown', setVisible);
    }
    document.addEventListener('visibilitychange', onChange);
    return () => {
      document.removeEventListener('visibilitychange', onChange);
      document.removeEventListener('mouseenter', setVisible);
      document.removeEventListener('keydown', setVisible);
    };
  }, [isVisible, onVisibilityChange]);

  return isVisible;
}
