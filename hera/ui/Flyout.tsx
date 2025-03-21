import { TileSize } from '@deities/athena/map/Configuration.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { isIPhone } from '@deities/ui/Browser.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import getColor, { BaseColor } from '@deities/ui/getColor.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';
import isPresent from '@nkzw/core/isPresent.js';
import { Fragment, ReactNode, useState } from 'react';
import { Actions } from '../Types.tsx';

export type FlyoutColor = BaseColor | null | 'error';

export const shouldPositionLeft = (position: Vector, width: number) =>
  position.x > (width / 3) * 2;

export default function Flyout({
  align,
  items: initialItems,
  mini,
  opaque,
  position,
  resetPosition,
  tileSize,
  width,
  zIndex,
}: {
  align?: 'top' | 'top-lower';
  items: ReactNode | ReadonlyArray<ReactNode | null>;
  mini?: boolean;
  opaque?: true;
  position: Vector;
  resetPosition: Actions['resetPosition'];
  tileSize: number;
  width: number;
  zIndex?: number;
}) {
  const items = Array.isArray(initialItems)
    ? initialItems.filter(isPresent)
    : [initialItems];
  const isTop = align === 'top' || align === 'top-lower';
  return (
    <div
      className={cx(
        baseStyle,
        isTop
          ? topStyle
          : shouldPositionLeft(position, width)
            ? leftStyle
            : rightStyle,
        align === 'top-lower' && topLowerStyle,
        mini && miniStyle,
        opaque && opaqueStyle,
      )}
      key={String(position)}
      onMouseEnter={resetPosition}
      style={{
        left: (isTop ? position.x - 0.5 : position.x + 0.3) * tileSize,
        top: (position.y - 0.5) * tileSize,
        zIndex: zIndex || 0,
      }}
    >
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {item}
          {index < items.length - 1 ? <FlyoutSeparator /> : null}
        </Fragment>
      ))}
    </div>
  );
}

type FlyoutProps = Readonly<{
  center?: boolean;
  children: ReactNode;
  color?: FlyoutColor;
  disabled?: boolean;
  highlight?: boolean;
  icon?: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  size?: 'large';
}>;

export function FlyoutItem({
  center,
  children,
  color,
  disabled,
  highlight,
  icon,
  interactive = true,
  onClick,
  onPointerEnter,
  onPointerLeave,
  size,
}: FlyoutProps) {
  const itemColor =
    color === 'error' ? applyVar('error-color') : color && getColor(color);
  const Component = onClick && !disabled ? 'a' : 'div';
  return (
    <Component
      className={cx(
        itemStyle,
        interactive && interactiveStyle,
        center && centerStyle,
        disabled && disabledItemStyle,
        highlight && 'highlight',
        icon || size === 'large' ? largeStyle : null,
      )}
      onClick={disabled ? undefined : onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {icon}
      <div
        className={cx(innerStyle, icon ? leftMarginStyle : null)}
        style={itemColor ? { color: itemColor } : undefined}
      >
        {children}
      </div>
    </Component>
  );
}

export function FlyoutItemWithHighlight({
  children,
  highlight,
  icon,
  ...props
}: Omit<FlyoutProps, 'icon' | 'onPointerEnter' | 'onPointerLeave'> &
  Readonly<{
    icon?: (highlight: boolean) => ReactNode;
  }>) {
  const [highlighted, setHighlighted] = useState(false);
  const isHighlighted = highlight || highlighted;
  return (
    <FlyoutItem
      {...props}
      highlight={highlight}
      icon={icon?.(isHighlighted)}
      onPointerEnter={() => setHighlighted(true)}
      onPointerLeave={() => setHighlighted(false)}
    >
      {children}
    </FlyoutItem>
  );
}

const FlyoutSeparator = () => (
  <div
    className={separatorStyle}
    style={{
      // Inline because of specificity.
      height: 0.5,
    }}
  />
);

const vars = new CSSVariables<'size'>('f');

const mini = TileSize / 2;
const regular = (TileSize / 3) * 2;
const large = TileSize;

const baseStyle = css`
  ${vars.set('size', regular + 'px')}

  ${pixelBorder(applyVar('background-color'), 2)}

  -webkit-text-size-adjust: 100%;
  background: ${applyVar('background-color')};
  display: flex;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
  flex-direction: column;
  font-size: calc(${isIPhone ? applyVar('scale') : 1} * 8px);
  line-height: 100%;
  gap: 2px;
  image-rendering: pixelated;
  opacity: 0.95;
  position: absolute;
  transform: translate3d(3px, -50%, 0);
  white-space: nowrap;

  > a,
  > div {
    height: ${vars.apply('size')};
  }

  &:after {
    border: solid transparent;
    content: ' ';
    height: 0;
    pointer-events: none;
    position: absolute;
    width: 0;
    border-width: 6px;
    margin-top: -6px;
    top: 50%;
  }
`;

const miniStyle = css`
  ${vars.set('size', mini + 'px')}
`;

const opaqueStyle = css`
  opacity: 1;
`;

const largeStyle = css`
  ${vars.set('size', large + 'px')}
`;

const topStyle = css`
  transform: translate3d(-50%, calc(-100% - ${TileSize}px), 0);

  &:after {
    border-top-color: ${applyVar('background-color')};
    bottom: -14px;
    left: calc(50% - 6px);
    top: unset;
  }
`;

const topLowerStyle = css`
  transform: translate3d(-50%, calc(-100% - ${TileSize * 0.8}px), 0);
`;

const rightStyle = css`
  &:after {
    border-right-color: ${applyVar('background-color')};
    right: calc(100% + 2px);
  }
`;

const leftStyle = css`
  transform: translate3d(calc(-100% - ${TileSize * 1.7}px), -50%, 0);

  &:after {
    border-left-color: ${applyVar('background-color')};
    left: calc(100% + 2px);
  }
`;

const itemStyle = css`
  align-items: center;
  box-sizing: content-box;
  color: ${applyVar('text-color')};
  display: flex;
  justify-content: left;
  padding: 0 4px;
  transition:
    transform 150ms ease,
    color 150ms ease;

  &.highlight {
    color: ${applyVar('highlight-color')};
    transform: scale(1.1);
  }
`;

const interactiveStyle = css`
  &:hover {
    color: ${applyVar('highlight-color')};
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const innerStyle = css`
  align-items: center;
  display: inline-flex;
  justify-content: left;
`;

const separatorStyle = css`
  background-color: ${applyVar('border-color-light')};
  width: 100%;
`;

const centerStyle = css`
  justify-content: center;
`;

const disabledItemStyle = css`
  opacity: 0.7;

  &:hover,
  &.highlight {
    transform: scale(1);
  }
`;

const leftMarginStyle = css`
  margin-left: 4px;
`;
