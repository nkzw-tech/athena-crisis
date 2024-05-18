import {
  FloatingEdge,
  FloatingWaterEdge,
  getFloatingEdgeAnimation,
} from '@deities/athena/info/Tile.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type { ModifierField } from '@deities/athena/MapData.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import { getFrame } from '../lib/tick.tsx';
import type { TileSet } from './renderTile.tsx';
import renderTile from './renderTile.tsx';

export default function renderFloatingTile(
  context: CanvasRenderingContext2D,
  mainContext: CanvasRenderingContext2D,
  tileset: TileSet,
  map: MapData,
  vision: VisionT,
  vector: Vector,
  modifier: ModifierField,
  tick: number,
  size: number,
  paused?: boolean,
  rerender = false,
) {
  if (rerender) {
    const targetX = vector.x * size;
    const targetY = vector.y * size;
    context.clearRect(targetX, targetY, size, size);
    mainContext.clearRect(targetX, targetY, size, size);
  }

  const [modifier0, modifier1] = Array.isArray(modifier)
    ? modifier
    : [modifier];

  renderTile(
    context,
    tileset,
    map,
    vision,
    (!paused &&
      getFrame(
        { animation: getFloatingEdgeAnimation(modifier0, map.config.biome) },
        modifier0,
        tick,
      )) ||
      0,
    vector,
    FloatingEdge,
    modifier0,
    size,
    false,
  );

  if (modifier1) {
    renderTile(
      context,
      tileset,
      map,
      vision,
      (!paused &&
        map.config.biome !== Biome.Spaceship &&
        getFrame(FloatingWaterEdge.sprite, modifier1, tick)) ||
        0,
      vector,
      FloatingWaterEdge,
      modifier1,
      size,
      false,
    );
  }
}
