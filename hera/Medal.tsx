import { PlayerID } from '@deities/athena/map/Player.tsx';
import { css, cx } from '@emotion/css';
import sprite from './lib/sprite.tsx';

export default function Medal({ player, zoom = 2 }: { player: PlayerID; zoom?: number }) {
  return <div className={cx(sprite('Medal', player), medalStyle)} style={{ zoom }} />;
}

const medalStyle = css`
  background-position: center;
  background-repeat: no-repeat;
  height: 10px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  image-rendering: pixelated;
  opacity: 1;
  width: 6px;
`;
