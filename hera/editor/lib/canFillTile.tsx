import { Beach, TileInfo } from '@deities/athena/info/Tile.tsx';

export default function canFillTile(tile?: TileInfo | null): tile is TileInfo {
  return !!(tile && tile.style.layer === 0 && tile !== Beach);
}
