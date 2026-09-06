import { House } from '@deities/athena/info/Building.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import { expect, test, vi } from 'vitest';
import getEntityPosition from '../getEntityPosition.tsx';
import renderTile from '../renderTile.tsx';

test.each([
  [24, 24, 48],
  [32, 24, 68],
  [32, 28, 66],
])(
  'building shadows use native atlas pixels with grid %i and entity size %i',
  (tileSize, buildingSize, target) => {
    const base = MapData.createMap({ map: Array(9).fill(Plain.id), size: { height: 3, width: 3 } });
    const position = vec(2, 2);
    const map = base.copy({ buildings: base.buildings.set(position, House.create(1)) });
    const drawImage = vi.fn();
    const context = { drawImage } as unknown as CanvasRenderingContext2D;
    const tiles = {} as HTMLImageElement;
    const buildings = {} as HTMLImageElement;
    renderTile(
      context,
      { buildings, structures: buildings, tiles },
      map,
      new Vision(1),
      0,
      position,
      Plain,
      0,
      tileSize,
      true,
      buildingSize,
    );
    expect(drawImage).toHaveBeenLastCalledWith(buildings, 120, 24, 24, 24, target, target, 24, 24);
    const origin = getEntityPosition(position, tileSize, buildingSize);
    expect([origin.x + tileSize, origin.y + tileSize]).toEqual([target, target]);
  },
);
