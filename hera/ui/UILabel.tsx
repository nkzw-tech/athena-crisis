import type { PlayerID } from '@deities/athena/map/Player.tsx';
import { css, cx } from '@emotion/css';
import sprite from '../lib/sprite.tsx';

export default function UILabel({
  className,
  color,
}: {
  className?: string;
  color: PlayerID;
}) {
  return <span className={cx(sprite('Label', color), labelStyle, className)} />;
}

const labelStyle = css`
  display: inline-block;
  height: 12px;
  image-rendering: pixelated;
  vertical-align: top;
  width: 12px;
  zoom: 2;
`;
