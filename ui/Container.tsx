import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import type { HTMLAttributes } from 'react';
import { memo } from 'react';
import type { StackProps } from './Stack.tsx';
import Stack from './Stack.tsx';

export default memo(function Container({
  className,
  offset,
  ...props
}: HTMLAttributes<HTMLDivElement> & StackProps & { offset?: boolean }) {
  return (
    <Stack
      {...props}
      className={cx(containerStyle, offset && offsetStyle, className)}
      vertical
    />
  );
});

export const ContainerWidth = `min(max(360px, 80vw), 1024px)`;

const containerStyle = css`
  width: ${ContainerWidth};
`;

const offsetStyle = css`
  padding: ${DoubleSize * 1.25}px 0;
`;
