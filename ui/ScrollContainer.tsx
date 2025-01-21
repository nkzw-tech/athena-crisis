import { cx } from '@emotion/css';
import { ReactNode, RefCallback, RefObject } from 'react';

let currentScrollContainer: HTMLElement | null = null;

export function getCurrentScrollContainer() {
  return currentScrollContainer || window;
}

export function setScrollContainer(element: HTMLElement | null) {
  currentScrollContainer = element;
}

export const ScrollContainerClassName = 'scroll-container';

export default function ScrollContainer({
  children,
  className,
  ref,
}: {
  children: ReactNode;
  className?: string;
  ref?: RefCallback<HTMLElement> | RefObject<HTMLElement | null>;
}) {
  return (
    <div
      className={cx(ScrollContainerClassName, className)}
      ref={(element) => {
        setScrollContainer(element);
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
    >
      {children}
    </div>
  );
}
