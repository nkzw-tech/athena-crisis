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
import { UnitStatusEffect } from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import { EndTurnAction, SupplyAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import { computeVisibleEndTurnActionResponse } from '../lib/computeVisibleActions.tsx';

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

test.each([false, true])(
  'hidden automatic supply keeps client and server casualties in sync (poison: %s)',
  (poisoned) => {
    const position = vec(3, 3);
    const supplier = vec(4, 3);
    const unit = Helicopter.create(2).setFuel(1).setHealth(10);
    const map = withModifiers(
      MapData.createMap({
        config: { fog: true },
        map: Array(25).fill(1),
        size: { height: 5, width: 5 },
        teams: initialMap.toJSON().teams,
        units: [
          [1, 3, Infantry.create(1).toJSON()],
          [3, 3, (poisoned ? unit.setStatusEffect(UnitStatusEffect.Poison) : unit).toJSON()],
          [4, 3, TransportHelicopter.create(2).toJSON()],
        ],
      }),
    );
    const vision = map.createVisionObject(1);
    const visibleMap = vision.apply(map);
    expect(visibleMap.units.has(position)).toBe(true);
    expect(visibleMap.units.has(supplier)).toBe(false);

    const [response, serverMap] = execute(map, vision, EndTurnAction())!;
    if (response.type !== 'EndTurn') {
      throw new Error('Expected an EndTurn response.');
    }
    const visibleResponse = computeVisibleEndTurnActionResponse(response, map, serverMap, vision);
    expect(visibleResponse.supply).toContain(position);
    const clientMap = applyActionResponse(visibleMap, vision, visibleResponse);

    expect(clientMap.units.get(position)).toEqual(serverMap.units.get(position));
    expect(clientMap.units.has(position)).toBe(!poisoned);
    expect(clientMap.getPlayer(1).stats).toEqual(serverMap.getPlayer(1).stats);
    expect(clientMap.getPlayer(2).stats).toEqual(serverMap.getPlayer(2).stats);
    expect(serverMap.getPlayer(1).stats.destroyedUnits).toBe(poisoned ? 1 : 0);
    expect(serverMap.getPlayer(2).stats.lostUnits).toBe(poisoned ? 1 : 0);
  },
);

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
