import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import type { ComponentProps, ReactNode } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon.tsx';
import MenuButton from './MenuButton.tsx';
import Stack from './Stack.tsx';

const duration = 150;

export default function ExpandableMenuButton({
  children,
  className,
  gap,
  isExpanded,
  style,
  toggleExpanded,
  ...props
}: ComponentProps<typeof MenuButton> & {
  children: ReactNode;
  gap?: ComponentProps<typeof Stack>['gap'];
  isExpanded: boolean;
  toggleExpanded: () => void;
}) {
  const [height, setHeight] = useState<number | string>('auto');
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      const timer = setTimeout(
        () => setHeight(element.offsetHeight),
        isExpanded ? duration : 0,
      );
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  return (
    <MenuButton
      className={cx(baseStyle, isExpanded && cursorBaseStyle, className)}
      onClick={(event) => {
        const isAnchor =
          'nodeName' in event.target && event.target.nodeName === 'A';
        if (!isExpanded && !isAnchor) {
          toggleExpanded();
        }
      }}
      style={{
        ...style,
        height,
      }}
      {...props}
    >
      <Stack
        className={cx(innerStyle, isExpanded && expandedInnerStyle)}
        gap={gap}
        nowrap
        ref={ref}
        vertical
      >
        {children}
      </Stack>

      <Icon
        button
        className={cx(iconStyle, isExpanded && visibleStyle)}
        icon={Close}
        onClick={toggleExpanded}
      />
    </MenuButton>
  );
}

const baseStyle = css`
  padding: 0;

  transition:
    height ${duration}ms ease-in-out,
    width ${duration}ms ease-in-out;
`;

const cursorBaseStyle = css`
  cursor: initial;
`;

const innerStyle = css`
  padding: 6px 6px 4px;
`;

const expandedInnerStyle = css`
  padding-bottom: 8px;
`;

const size = DoubleSize;
const iconStyle = css`
  height: ${size}px;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  transform: scale(0);
  transition:
    opacity ${duration}ms ease-in-out,
    transform ${duration}ms ease-in-out;
  width: ${size}px;
`;

const visibleStyle = css`
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
`;
