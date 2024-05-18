import { cx } from '@emotion/css';
import type { SVGAttributes } from 'react';
import { memo } from 'react';
import { SquareButtonStyle } from './Button.tsx';

export type SVGIcon = Readonly<{
  body: string;
  height?: number;
  scale?: number;
  width?: number;
}>;

const Icon = memo(function Icon({
  button,
  className,
  horizontalFlip,
  icon,
  style,
  ...props
}: SVGAttributes<SVGElement> & {
  button?: true;
  horizontalFlip?: boolean;
  icon: SVGIcon;
}) {
  const __html = horizontalFlip
    ? `<g transform="scale(-1, 1)" transform-origin="50% 50%">${icon.body}</g>`
    : icon.body;

  return (
    <svg
      className={cx(button && SquareButtonStyle, className)}
      dangerouslySetInnerHTML={{ __html }}
      height="1em"
      style={
        icon.scale ? { ...style, transform: `scale(${icon.scale})` } : style
      }
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    />
  );
});

export default Icon;
