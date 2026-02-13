import { css, cx } from '@emotion/css';
import Stack, { StackProps } from '@nkzw/stack';
import { HTMLAttributes } from 'react';
import Breakpoints from './Breakpoints.tsx';

export default function AdaptiveStack({
  reverse,
  vertical,
  ...props
}: HTMLAttributes<HTMLDivElement> & StackProps) {
  return (
    <Stack
      {...props}
      className={cx(adaptiveStyle, reverse && vertical && adaptiveVerticalReverseStyle)}
      vertical={vertical}
    />
  );
}

const adaptiveStyle = css`
  flex-direction: column !important;

  ${Breakpoints.sm} {
    flex-direction: row !important;
  }
`;

const adaptiveVerticalReverseStyle = css`
  ${Breakpoints.sm} {
    flex-direction: row !important;
  }
`;
