import {
  AttributeRange,
  AttributeRangeWithZero,
  LargeAttributeRangeWithZero,
} from '@deities/athena/lib/getAttributeRange.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import { StarEmpty, StarFull, StarHalf } from '@deities/ui/icons/Stars.tsx';
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

const StarEmptyIcon = <Icon icon={StarEmpty} />;
const StarHalfIcon = <Icon icon={StarHalf} />;
const StarFullIcon = <Icon icon={StarFull} />;

const toValue = (value: AttributeRangeWithZero) => (value === 0 ? 1 : value);

const starIcon = (value: number, boundary: number) =>
  value >= boundary ? StarFullIcon : StarEmptyIcon;

const halfStarIcon = (value: number, boundary: number) =>
  value >= boundary
    ? value >= boundary + 1
      ? StarFullIcon
      : StarHalfIcon
    : StarEmptyIcon;

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
