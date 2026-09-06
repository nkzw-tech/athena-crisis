import { MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Shipyard } from '@deities/athena/info/Building.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Helicopter } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import {
  captureGameActionResponse,
  captureOne,
  getRenderedEntityLayouts,
  getRenderedGameMapState,
} from '../screenshot.tsx';

const baseMap = withModifiers(
  MapData.createMap({
    map: Array(30).fill(Plain.id),
    size: { height: 5, width: 6 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  }),
);
const map = baseMap.copy({
  buildings: baseMap.buildings.set(vec(4, 3), Shipyard.create(1, { label: 2 })),
  units: baseMap.units.set(vec(2, 3), Helicopter.create(1, { label: 3 }).setHealth(70).setFuel(10)),
});

test('centers entities without resizing or resampling their art', async () => {
  const measurements = [];
  for (const [tileSize, unitSize, buildingSize] of [
    [24, 24, 24],
    [32, 24, 24],
    [32, 20, 28],
  ]) {
    await captureOne(map, '1', { buildingSize, tileSize, unitSize });
    const entities = await getRenderedEntityLayouts();
    const unit = entities.find(({ type }) => type === 'unit')!;
    const buildings = entities.filter(({ type }) => type === 'building');
    measurements.push({ buildings, unit });
    expect(unit).toMatchObject({
      height: unitSize,
      width: unitSize,
      x: tileSize + (tileSize - unitSize) / 2,
      y: 2 * tileSize + (tileSize - unitSize) / 2,
    });
    expect(buildings.length).toBeGreaterThan(0);
    for (const building of buildings) {
      expect(building).toMatchObject({
        height: 48,
        width: 24,
        x: 3 * tileSize + (tileSize - buildingSize) / 2,
        y: 2 * tileSize + (tileSize - buildingSize) / 2 - 24,
      });
    }
  }
  expect(measurements[1].unit.parts).toEqual(measurements[0].unit.parts);
  for (const [index, building] of measurements[1].buildings.entries()) {
    const original = measurements[0].buildings[index];
    expect(building.parts).toEqual(original.parts);
    expect(building.backgroundX).toBe(original.backgroundX);
    expect(building.backgroundY).toBe(original.backgroundY);
  }
  const sprites = measurements.map(({ unit }) =>
    unit.parts.filter(({ height, width }) => width === 32 && height === 32),
  );
  expect(sprites[0].length).toBeGreaterThanOrEqual(2);
  expect(sprites[2]).toEqual(sprites[0]);
});

test.each([24, 32])('keeps units centered after movement on a %ipx grid', async (tileSize) => {
  const [, response] = await executeGameActions(map, [
    MoveAction(vec(2, 3), vec(2, 2), [vec(3, 3), vec(3, 2), vec(2, 2)]),
  ]);
  await captureGameActionResponse(map, response, '1', { animationSpeed: 'fast', tileSize });
  const entities = await getRenderedEntityLayouts();
  expect(entities.find(({ type }) => type === 'unit')).toMatchObject({
    height: 24,
    width: 24,
    x: tileSize + (tileSize - 24) / 2,
    y: tileSize + (tileSize - 24) / 2,
  });
  expect(await getRenderedGameMapState()).toEqual({ animations: [] });
});
