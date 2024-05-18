import type { RefObject } from 'react';
import { useEffect } from 'react';

export default function useScrollIntoView(
  element: RefObject<HTMLElement>,
  scrollIntoView: boolean | undefined,
) {
  useEffect(() => {
    if (element.current && scrollIntoView) {
      element.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [element, scrollIntoView]);
}
