import createContextHook from '@deities/ui/hooks/createContextHook.tsx';
import { useEffect, useState } from 'react';

const [HideContext, useHide] = createContextHook(() => {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.code === 'KeyB'
      ) {
        event.preventDefault();

        setHidden((hidden) => !hidden);
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, []);

  return hidden;
}, false);

export { HideContext };
export default useHide;
