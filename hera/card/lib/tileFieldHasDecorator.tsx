import type { TileField } from '@deities/athena/info/Tile.tsx';
import { getTile, getTileInfo } from '@deities/athena/info/Tile.tsx';
import type { Biome } from '@deities/athena/map/Biome.tsx';

export default function tileFieldHasDecorator(field: TileField, biome: Biome) {
  const tile0 = getTile(field, 0);
  const tile1 = getTile(field, 1);
  return (
    (tile0 && getTileInfo(tile0).style.decorator?.isVisible(biome)) ||
    (tile1 && getTileInfo(tile1).style.decorator?.isVisible(biome))
  );
}
