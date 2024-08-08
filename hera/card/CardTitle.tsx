import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import getColor from '@deities/ui/getColor.tsx';
import { css, cx } from '@emotion/css';
import { HTMLAttributes } from 'react';

export default function CardTitle({
  className,
  player,
  style,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { player?: PlayerID }) {
  const color = player != null && getColor(player);
  return (
    <h1
      {...props}
      className={cx(h1Style, className)}
      style={color ? { ...style, color } : style}
    />
  );
}

export function CardInfoHeading({
  className,
  player,
  style,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { player?: PlayerID }) {
  const color = player != null && getColor(player);
  return (
    <h2
      {...props}
      className={cx(h2Style, className)}
      style={color ? { ...style, color } : style}
    />
  );
}

const h1Style = css`
  ${Breakpoints.sm} {
    margin-right: ${TileSize * 5}px;
  }
`;

const h2Style = css`
  font-size: 1.15em;

  ${Breakpoints.sm} {
    font-size: 1.3em;
  }
`;
