import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { css, cx } from '@emotion/css';
import { StackProps, VStack } from '@nkzw/stack';
import { HTMLAttributes, memo } from 'react';

export default memo(function Container({
  className,
  offset,
  ...props
}: HTMLAttributes<HTMLDivElement> &
  Omit<StackProps, 'vertical'> & { offset?: boolean }) {
  return (
    <VStack
      {...props}
      className={cx(containerStyle, offset && offsetStyle, className)}
      wrap
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
