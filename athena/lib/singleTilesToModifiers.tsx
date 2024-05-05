import { Bridge, getTile, RailBridge } from '../info/Tile.tsx';
import MapData from '../MapData.tsx';
import { Modifier } from './Modifier.tsx';

export function singleTilesToModifiers(map: MapData) {
  return map.copy({
    modifiers: map.mapFields((_, index) => {
      const tile = map.map[index];
      if (
        getTile(tile, Bridge.style.layer) === Bridge.id ||
        getTile(tile, RailBridge.style.layer) === RailBridge.id
      ) {
        return [Modifier.Vertical, Modifier.HorizontalCrossing];
      }
      return map.modifiers[index];
    }),
  });
}
