import type { TileField } from '@deities/athena/info/Tile.tsx';
import { getTile, getTileInfo } from '@deities/athena/info/Tile.tsx';

export default function tileFieldHasAnimation(field: TileField) {
  const tile0 = getTile(field, 0);
  const tile1 = getTile(field, 1);
  return (
    (tile0 && getTileInfo(tile0).sprite.animation) ||
    (tile1 && getTileInfo(tile1).sprite.animation)
  );
}
