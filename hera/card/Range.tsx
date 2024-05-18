import type {
  AttributeRange,
  AttributeRangeWithZero,
  LargeAttributeRangeWithZero,
} from '@deities/athena/lib/getAttributeRange.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { memo, useState } from 'react';

const colors = {
  1: getColor('red'),
  2: applyVar('color-red-orange'),
  3: getColor('orange'),
  4: applyVar('color-orange-green'),
  5: getColor('green'),
} as const;

const StarEmpty = (
  <Icon
    icon={{
      body: `<path fill="currentColor" d="M11 1h2v1h-2V1ZM13 2h1v2h-1V2ZM10 2h1v2h-1V2ZM14 4h1v2h-1V4ZM9 4h1v2H9V4ZM15 6h1v2h-1V6ZM8 6h1v2H8V6ZM2 8h6v1H2V8ZM16 8h6v1h-6V8ZM1 9h1v1H1V9ZM2 10h1v1H2v-1ZM3 11h1v1H3v-1ZM4 12h1v1H4v-1ZM5 13h1v1H5v-1ZM18 13h1v1h-1v-1ZM19 12h1v1h-1v-1ZM20 11h1v1h-1v-1ZM21 10h1v1h-1v-1ZM22 9h1v1h-1V9ZM6 14h1v2H6v-2ZM5 16h1v2H5v-2ZM4 18h1v2H4v-2ZM19 18h1v2h-1v-2ZM18 16h1v2h-1v-2ZM17 14h1v2h-1v-2ZM3 20h1v3H3v-3ZM20 20h1v3h-1v-3ZM4 22h2v1H4v-1ZM6 21h2v1H6v-1ZM8 20h2v1H8v-1ZM14 20h2v1h-2v-1ZM16 21h2v1h-2v-1ZM18 22h2v1h-2v-1ZM10 19h4v1h-4v-1Z"/>`,
      height: 24,
      width: 24,
    }}
  />
);

const StarHalf = (
  <Icon
    icon={{
      body: `<path fill="currentColor" d="M11 1h2v1h-2V1ZM13 2h1v2h-1V2ZM10 2h2v2h-2V2ZM4 10h8v2H4v-2ZM6 12h6v6H6v-6ZM4 18h8v2H4v-2ZM14 4h1v2h-1V4Z"/><path fill="currentColor" d="M9 4h3v15H9V4ZM15 6h1v2h-1V6ZM8 6h1v2H8V6Z"/><path fill="currentColor" d="M2 8h10v2H2V8ZM16 8h6v1h-6V8ZM4 20h6v1H4v-1ZM1 9h1v1H1V9ZM2 10h1v1H2v-1ZM3 11h1v1H3v-1ZM4 12h1v1H4v-1ZM5 13h1v1H5v-1ZM18 13h1v1h-1v-1ZM19 12h1v1h-1v-1ZM20 11h1v1h-1v-1ZM20 10h1v1h-1v-1ZM18 12h1v1h-1v-1ZM5 12h1v1H5v-1ZM3 10h1v1H3v-1ZM21 10h1v1h-1v-1ZM22 9h1v1h-1V9ZM6 14h1v2H6v-2ZM5 16h1v2H5v-2ZM4 18h1v2H4v-2ZM19 18h1v2h-1v-2ZM18 16h1v2h-1v-2ZM17 14h1v2h-1v-2ZM3 20h1v3H3v-3ZM20 20h1v3h-1v-3ZM4 22h2v1H4v-1ZM6 21h2v1H6v-1ZM4 21h2v1H4v-1Z"/><path fill="currentColor" d="M8 20h2v1H8v-1ZM14 20h2v1h-2v-1ZM16 21h2v1h-2v-1ZM18 22h2v1h-2v-1ZM10 19h4v1h-4v-1Z"/>`,
      height: 24,
      width: 24,
    }}
  />
);

const StarFull = (
  <Icon
    icon={{
      body: `<path fill="currentColor" d="M11 1h2v1h-2V1ZM13 2h1v2h-1V2ZM10 2h3v2h-3V2ZM4 10h16v2H4v-2ZM6 12h12v6H6v-6ZM4 18h16v2H4v-2ZM14 4h1v2h-1V4Z"/><path fill="currentColor" d="M9 4h5v15H9V4ZM15 6h1v2h-1V6ZM14 6h1v2h-1V6ZM8 6h1v2H8V6Z"/><path fill="currentColor" d="M2 8h14v2H2V8ZM16 8h6v1h-6V8ZM16 9h6v1h-6V9ZM15 20h6v1h-6v-1ZM4 20h6v1H4v-1ZM1 9h1v1H1V9ZM2 10h1v1H2v-1ZM3 11h1v1H3v-1ZM4 12h1v1H4v-1ZM5 13h1v1H5v-1ZM18 13h1v1h-1v-1ZM19 12h1v1h-1v-1ZM20 11h1v1h-1v-1ZM20 10h1v1h-1v-1ZM18 12h1v1h-1v-1ZM5 12h1v1H5v-1ZM3 10h1v1H3v-1ZM21 10h1v1h-1v-1ZM22 9h1v1h-1V9ZM6 14h1v2H6v-2ZM5 16h1v2H5v-2ZM4 18h1v2H4v-2ZM19 18h1v2h-1v-2ZM18 16h1v2h-1v-2ZM17 14h1v2h-1v-2ZM3 20h1v3H3v-3Z"/><path fill="currentColor" d="M20 20h1v3h-1v-3ZM4 22h2v1H4v-1ZM6 21h2v1H6v-1ZM4 21h2v1H4v-1ZM18 21h2v1h-2v-1ZM8 20h2v1H8v-1ZM14 20h2v1h-2v-1ZM16 21h2v1h-2v-1ZM18 22h2v1h-2v-1ZM10 19h4v1h-4v-1Z"/>`,
      height: 24,
      width: 24,
    }}
  />
);

const toValue = (value: AttributeRangeWithZero) => (value === 0 ? 1 : value);

const starIcon = (value: number, boundary: number) =>
  value >= boundary ? StarFull : StarEmpty;

const halfStarIcon = (value: number, boundary: number) =>
  value >= boundary ? (value >= boundary + 1 ? StarFull : StarHalf) : StarEmpty;

export default memo(function Range({
  end,
  invert,
  invertColors,
  value,
  wide,
}: {
  end?: true;
  invert?: true;
  invertColors?: true;
  value: AttributeRangeWithZero;
  wide?: true;
}) {
  if (invert) {
    value = (6 - toValue(value)) as AttributeRange;
  }

  const style = {
    color:
      colors[
        (invertColors ? 6 - toValue(value) : toValue(value)) as AttributeRange
      ],
  };

  return (
    <Stack
      alignEnd
      className={cx(
        wide ? selectorContainerStyle : containerStyle,
        end && endStyle,
      )}
      nowrap
      start
    >
      <div className={rangeStyle} style={style}>
        {starIcon(value, 1)}
      </div>
      <div className={rangeStyle} style={style}>
        {starIcon(value, 2)}
      </div>
      <div className={rangeStyle} style={style}>
        {starIcon(value, 3)}
      </div>
      <div className={rangeStyle} style={style}>
        {starIcon(value, 4)}
      </div>
      <div className={rangeStyle} style={style}>
        {starIcon(value, 5)}
      </div>
    </Stack>
  );
});

export const LargeRange = memo(function LargeRange({
  end,
  value,
}: {
  end?: true;
  value: LargeAttributeRangeWithZero;
}) {
  const style = {
    color: colors[toValue(Math.ceil(value / 2) as AttributeRange)],
  };

  return (
    <Stack
      alignEnd
      className={cx(containerStyle, end && endStyle)}
      nowrap
      start
    >
      <div className={rangeStyle} style={style}>
        {halfStarIcon(value, 1)}
      </div>
      <div className={rangeStyle} style={style}>
        {halfStarIcon(value, 3)}
      </div>
      <div className={rangeStyle} style={style}>
        {halfStarIcon(value, 5)}
      </div>
      <div className={rangeStyle} style={style}>
        {halfStarIcon(value, 7)}
      </div>
      <div className={rangeStyle} style={style}>
        {halfStarIcon(value, 9)}
      </div>
    </Stack>
  );
});

export const RangeSelector = memo(function RangeSelector({
  invert,
  onSelect,
  value: initialValue,
}: {
  invert?: true;
  onSelect: (value: AttributeRange) => void;
  value?: AttributeRangeWithZero;
}) {
  const [isActive, setIsActive] = useState(false);
  const [value, setValue] = useState<AttributeRangeWithZero>(initialValue || 0);
  const color = (value: AttributeRange) =>
    colors[invert ? ((6 - value) as AttributeRange) : value];

  return (
    <Stack
      alignEnd
      className={selectorContainerStyle}
      nowrap
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => {
        setIsActive(false);
        setValue(initialValue || 0);
      }}
      start
    >
      <div
        className={cx(
          SquareButtonStyle,
          rangeStyle,
          rangeSelectorStyle,
          isActive && value >= 1 && 'hover',
        )}
        onClick={() => onSelect(1)}
        onPointerEnter={() => setValue(1)}
        style={{ color: color(1) }}
      >
        {starIcon(value, 1)}
      </div>
      <div
        className={cx(
          SquareButtonStyle,
          rangeStyle,
          rangeSelectorStyle,
          isActive && value >= 2 && 'hover',
        )}
        onClick={() => onSelect(2)}
        onPointerEnter={() => setValue(2)}
        style={{ color: color(2) }}
      >
        {starIcon(value, 2)}
      </div>
      <div
        className={cx(
          SquareButtonStyle,
          rangeStyle,
          rangeSelectorStyle,
          isActive && value >= 3 && 'hover',
        )}
        onClick={() => onSelect(3)}
        onPointerEnter={() => setValue(3)}
        style={{ color: color(3) }}
      >
        {starIcon(value, 3)}
      </div>
      <div
        className={cx(
          SquareButtonStyle,
          rangeStyle,
          rangeSelectorStyle,
          isActive && value >= 4 && 'hover',
        )}
        onClick={() => onSelect(4)}
        onPointerEnter={() => setValue(4)}
        style={{ color: color(4) }}
      >
        {starIcon(value, 4)}
      </div>
      <div
        className={cx(
          SquareButtonStyle,
          rangeStyle,
          rangeSelectorStyle,
          isActive && value >= 5 && 'hover',
        )}
        onClick={() => onSelect(5)}
        onPointerEnter={() => setValue(5)}
        style={{ color: color(5) }}
      >
        {starIcon(value, 5)}
      </div>
    </Stack>
  );
});

const containerStyle = css`
  gap: 1.5px;
`;

const selectorContainerStyle = css`
  gap: 16px;
`;

const endStyle = css`
  justify-self: flex-end;
`;

const rangeStyle = css`
  align-self: center;
  color: ${applyVar('border-color-light')};
  display: inline-flex;

  font-size: 0.8em;

  ${Breakpoints.xs} {
    font-size: 1em;
  }
`;

const rangeSelectorStyle = css`
  &.hover,
  &:hover {
    transform: scale(1.3);
  }

  &:active {
    transform: scale(1);
  }
`;
