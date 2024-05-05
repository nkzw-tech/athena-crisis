import { cx } from '@emotion/css';
import { ReactNode } from 'react';

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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(ScrollContainerClassName, className)}
      ref={setScrollContainer}
    >
      {children}
    </div>
  );
}
