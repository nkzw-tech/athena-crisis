import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import { HTMLAttributes, memo } from 'react';
import Stack, { StackProps } from './Stack.tsx';

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

export const ContainerWidth = `min(90vw, 1024px)`;

const containerStyle = css`
  width: ${ContainerWidth};
`;

const offsetStyle = css`
  padding: ${DoubleSize * 1.25}px 0;
`;
