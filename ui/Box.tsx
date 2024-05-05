import { css, cx } from '@emotion/css';
import { HTMLAttributes, memo } from 'react';
import { applyVar } from './cssVar.tsx';
import pixelBorder from './pixelBorder.tsx';
import Stack, { StackProps } from './Stack.tsx';

export default memo(function Box({
  blur,
  className,
  selected,
  ...props
}: HTMLAttributes<HTMLDivElement> &
  StackProps &
  Readonly<{
    blur?: true;
    selected?: boolean;
  }>) {
  return (
    <Stack
      {...props}
      className={cx(
        boxStyle,
        BoxStyle,
        blur && blurStyle,
        selected && selectedStyle,
        className,
      )}
    />
  );
});

const boxStyle = css`
  min-height: 32px;
  padding: 12px;
`;

const blurStyle = css`
  backdrop-filter: blur(4px);
`;

const selectedStyle = css`
  ${pixelBorder(undefined, 2)}
`;

export const BoxStyle = css`
  ${pixelBorder(applyVar('background-color-light'))}
  background: ${applyVar('background-color-light')};
`;
