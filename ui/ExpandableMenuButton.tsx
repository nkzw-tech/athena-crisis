import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import {
  ComponentProps,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import clipBorder from './clipBorder.tsx';
import { applyVar } from './cssVar.tsx';
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
      <div className={cx(iconContainerStyle, isExpanded && visibleStyle)}>
        <Icon
          button
          className={iconStyle}
          icon={Close}
          onClick={toggleExpanded}
        />
      </div>
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

const size = 28;
const iconContainerStyle = css`
  ${clipBorder(2)}

  background: ${applyVar('background-color-light')};
  height: ${size}px;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  right: 4px;
  top: 10px;
  transform: scale(0);
  transition:
    opacity ${duration}ms ease-in-out,
    transform ${duration}ms ease-in-out;
  width: ${size}px;
  z-index: 3;
`;

const visibleStyle = css`
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
`;

const iconStyle = css`
  height: ${size}px;
  width: ${size}px;
`;
