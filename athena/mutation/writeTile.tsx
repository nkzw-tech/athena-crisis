import type { TileField, TileInfo, TileLayer } from '../info/Tile.tsx';
import { getTile, getTileInfo } from '../info/Tile.tsx';
import type { ModifierField } from '../MapData.tsx';

const getModifier = (modifier: ModifierField, layer: TileLayer): number => {
  const isNumber = typeof modifier === 'number';
  return (isNumber ? (layer === 0 ? modifier : 0) : modifier[layer]) || 0;
};

export default function writeTile(
  newMap: Array<TileField>,
  newModifiers: Array<ModifierField>,
  index: number,
  info: TileInfo | null,
  modifier = 0,
) {
  if (!info) {
    eraseLayer1Tile(newMap, newModifiers, index);
    return;
  }

  const field = newMap[index];
  const modifierField = newModifiers[index];
  if (info.style.layer === 1) {
    const modifier0 = getModifier(modifierField, 0);
    newMap[index] = [getTileInfo(field, 0).id, info.id];
    newModifiers[index] = [modifier0, modifier];
  } else {
    const tile = getTile(field, 1);
    const modifier1 = getModifier(modifierField, 1);
    newMap[index] = tile ? [info.id, tile] : info.id;
    newModifiers[index] = tile && modifier1 ? [modifier, modifier1] : modifier;
  }
}

function eraseLayer1Tile(
  newMap: Array<TileField>,
  newModifiers: Array<ModifierField>,
  index: number,
) {
  const tile = getTileInfo(newMap[index], 1);
  if (tile.style.fallback?.style.layer === 1) {
    writeTile(newMap, newModifiers, index, tile.style.fallback);
  } else {
    newMap[index] = getTileInfo(newMap[index], 0).id;
    newModifiers[index] = getModifier(newModifiers[index], 0);
  }
}
