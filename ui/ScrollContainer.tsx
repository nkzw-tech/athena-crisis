import { DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import Reply from '@iconify-icons/pixelarticons/reply.js';
import { ReactNode, RefCallback, RefObject, useCallback, useRef, useState } from 'react';
import useInput from './controls/useInput.tsx';
import { applyVar } from './cssVar.tsx';
import Icon from './Icon.tsx';
import { FadePulseStyle } from './PulseStyle.tsx';

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

export function ScrollContainerWithNavigation({
  children,
  className,
  navigate,
  scrollContainerClassName,
  scrollDownClassName,
}: {
  children: ReactNode;
  className?: string;
  // Needed to reset state when switching tabs in a dialog.
  key: string;
  navigate: boolean;
  scrollContainerClassName?: string;
  scrollDownClassName?: string;
}) {
  const [showArrow, setShowArrow] = useState(false);
  const ref = useRef<{
    cleanup: () => void;
    down: () => void;
    up: () => void;
  } | null>(null);

  const setRef = useCallback(
    (element: HTMLDivElement) => {
      if (ref.current) {
        ref.current.cleanup();
        ref.current = null;
      }

      if (!element) {
        return;
      }

      const onScroll = () => {
        const shouldShow =
          element.scrollTop + element.clientHeight < element.scrollHeight - DoubleSize;
        if (shouldShow !== showArrow) {
          setShowArrow(shouldShow);
        }
      };

      element.addEventListener('scroll', onScroll);
      onScroll();
      ref.current = {
        cleanup: () => element.removeEventListener('scroll', onScroll),
        down: () =>
          element.scrollTo({
            behavior: 'smooth',
            top: element.scrollTop + TileSize * 10,
          }),
        up: () =>
          element.scrollTo({
            behavior: 'smooth',
            top: element.scrollTop - TileSize * 10,
          }),
      };
    },
    [showArrow],
  );

  useInput(
    'navigate',
    useCallback(
      (event) => {
        if (!navigate || !ref.current) {
          return;
        }

        const { y } = event.detail;
        if (y < 0) {
          event.preventDefault();
          ref.current.up();
        } else if (y > 0) {
          event.preventDefault();
          ref.current.down();
        }
      },
      [navigate],
    ),
    'dialog',
  );

  return (
    <div className={className}>
      <ScrollContainer className={scrollContainerClassName} ref={setRef}>
        {children}
      </ScrollContainer>
      <div className={cx(scrollDownStyle, scrollDownClassName, showArrow && arrowVisibleStyle)}>
        <div className={scrollDownIconStyle}>
          <Icon className={FadePulseStyle} icon={Reply} />
        </div>
      </div>
    </div>
  );
}

const scrollDownStyle = css`
  background-image: linear-gradient(
    0deg,
    ${applyVar('background-color')} 10px,
    rgba(255, 255, 255, 0) 30px
  );
  inset: 0;
  bottom: -1px;
  opacity: 0;
  pointer-events: none;
  position: fixed;
  transition: opacity 300ms ease;
  z-index: 1000;
`;

const scrollDownIconStyle = css`
  bottom: 4px;
  color: ${applyVar('border-color')};
  position: absolute;
  right: 4px;
  transform: rotate(-90deg);
`;

const arrowVisibleStyle = css`
  opacity: 1;
`;
