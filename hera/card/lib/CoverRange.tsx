import { getAllTiles } from '@deities/athena/info/Tile.tsx';
import getAttributeRange from '@deities/athena/lib/getAttributeRange.tsx';
import minBy from '@nkzw/core/minBy.js';

const tiles = getAllTiles().filter(
  ({ configuration: { cover } }) => cover < Number.POSITIVE_INFINITY,
);

const min =
  (minBy(
    tiles.filter(({ configuration: { cover } }) => cover > 0),
    ({ configuration: { cover } }) => cover,
  )?.configuration.cover || 0) - 0.01;

export default getAttributeRange(
  tiles,
  ({ configuration: { cover } }) => cover,
  min,
  10,
);
