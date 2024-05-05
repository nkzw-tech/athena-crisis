import {
  AmphibiousTank,
  Battleship,
  Bomber,
  FighterJet,
  Frigate,
  Helicopter,
  Infantry,
  Jeep,
  PatrolShip,
  SmallTank,
  SupportShip,
  TransportHelicopter,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import { SupplyAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 1000, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 1000, id: 2, userId: '4' }],
      },
    ],
  }),
);
const player1 = initialMap.getPlayer(1);
const vision = initialMap.createVisionObject(player1);

test('supply surrounding units with a Jeep', () => {
  const from = vec(2, 2);
  const toA = vec(1, 2);
  const toB = vec(2, 1);
  const toC = vec(3, 2);
  const toD = vec(2, 3);
  const map = initialMap.copy({
    units: initialMap.units
      .set(from, Jeep.create(1))
      .set(toA, SmallTank.create(1).setFuel(1))
      .set(toB, AmphibiousTank.create(1).setFuel(1))
      .set(toC, PatrolShip.create(1).setFuel(1))
      .set(toD, Infantry.create(1).setFuel(1)),
  });
  const [, newMap] = execute(map, vision, SupplyAction(from))!;

  for (const to of [toA, toB, toC, toD]) {
    const newUnit = newMap.units.get(to)!;
    expect(map.units.get(to)!.fuel).toBeLessThan(newUnit.fuel);
    expect(newUnit.fuel).toEqual(newUnit.info.configuration.fuel);
  }
});

test('supply surrounding units with a Transport Chopper', () => {
  const from = vec(2, 2);
  const toA = vec(1, 2);
  const toB = vec(2, 1);
  const toC = vec(3, 2);
  const toD = vec(2, 3);
  const map = initialMap.copy({
    units: initialMap.units
      .set(from, TransportHelicopter.create(1))
      .set(toA, Helicopter.create(1).setFuel(1))
      .set(toB, SmallTank.create(1).setFuel(1))
      .set(toC, FighterJet.create(1).setFuel(1))
      .set(toD, Bomber.create(1).setFuel(1)),
  });
  const [, newMap] = execute(map, vision, SupplyAction(from))!;

  for (const to of [toA, toC, toD]) {
    const newUnit = newMap.units.get(to)!;
    expect(map.units.get(to)!.fuel).toBeLessThan(newUnit.fuel);
    expect(newUnit.fuel).toEqual(newUnit.info.configuration.fuel);
  }

  expect(map.units.get(toB)!.fuel).toEqual(newMap.units.get(toB)!.fuel);
});

test('supply surrounding units with a Support Ship', () => {
  const from = vec(2, 2);
  const toA = vec(1, 2);
  const toB = vec(2, 1);
  const toC = vec(3, 2);
  const toD = vec(2, 3);
  const map = initialMap.copy({
    units: initialMap.units
      .set(from, SupportShip.create(1))
      .set(toA, Helicopter.create(1).setFuel(1))
      .set(toB, SmallTank.create(1).setFuel(1))
      .set(toC, Frigate.create(1).setFuel(1))
      .set(toD, Battleship.create(1).setFuel(1)),
  });
  const [, newMap] = execute(map, vision, SupplyAction(from))!;

  for (const to of [toB, toC, toD]) {
    const newUnit = newMap.units.get(to)!;
    expect(map.units.get(to)!.fuel).toBeLessThan(newUnit.fuel);
    expect(newUnit.fuel).toEqual(newUnit.info.configuration.fuel);
  }

  expect(map.units.get(toA)!.fuel).toEqual(newMap.units.get(toA)!.fuel);
});
