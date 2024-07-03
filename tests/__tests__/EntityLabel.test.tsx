import {
  CaptureAction,
  CreateBuildingAction,
  CreateUnitAction,
  DropUnitAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Barracks, Factory } from '@deities/athena/info/Building.tsx';
import { ConstructionSite } from '@deities/athena/info/Tile.tsx';
import {
  APU,
  Flamethrower,
  Helicopter,
  Hovercraft,
  Infantry,
  Jeep,
  Pioneer,
} from '@deities/athena/info/Unit.tsx';
import dropLabels from '@deities/athena/lib/dropLabels.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [1, ConstructionSite.id, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 5000, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 5000, id: 2, userId: '4' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = HumanPlayer.from(map.getPlayer(2), '4');

test('carries labels forward when creating buildings or units', async () => {
  const from = vec(1, 1);
  const to = vec(2, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(from, Barracks.create(player1, { label: 1 })),
    units: map.units
      .set(from, Pioneer.create(player1, { label: 3 }))
      .set(vec(3, 3), Helicopter.create(player2)),
  });

  const [, gameActionResponse] = executeGameActions(initialMap, [
    MoveAction(from, to),
    CreateUnitAction(from, Infantry.id, from),
    CreateBuildingAction(to, Factory.id),
    EndTurnAction(),
    EndTurnAction(),
    CreateUnitAction(to, APU.id, to),
  ]);

  expect(
    snapshotEncodedActionResponse(gameActionResponse),
  ).toMatchInlineSnapshot(
    `
    "Move (1,1 → 2,1) { fuel: 39, completed: false, path: [2,1] }
    CreateUnit (1,1 → 1,1) { unit: Infantry { id: 2, health: 100, player: 1, fuel: 50, moved: true, name: 'Valentin', completed: true, label: 1 }, free: false, skipBehaviorRotation: false }
    CreateBuilding (2,1) { building: Factory { id: 3, health: 100, player: 1, completed: true, label: 3 } }
    EndTurn { current: { funds: 4550, player: 1 }, next: { funds: 5000, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
    EndTurn { current: { funds: 5000, player: 2 }, next: { funds: 4550, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
    CreateUnit (2,1 → 2,1) { unit: APU { id: 4, health: 100, player: 1, fuel: 40, ammo: [ [ 1, 6 ] ], moved: true, name: 'Nora', completed: true, label: 3 }, free: false, skipBehaviorRotation: false }"
  `,
  );
});

test('carries labels forward when transporting units', () => {
  const from = vec(1, 1);
  const toA = vec(2, 1);
  const initialMap = map.copy({
    units: map.units
      .set(from, Pioneer.create(player1, { label: 3 }))
      .set(toA, Jeep.create(player1))
      .set(vec(3, 3), Helicopter.create(player2)),
  });

  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    MoveAction(from, toA),
    DropUnitAction(toA, 0, from),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,1) { fuel: 39, completed: false, path: [2,1] }
      DropUnit (2,1 → 1,1) { index: 0 }
      EndTurn { current: { funds: 5000, player: 1 }, next: { funds: 5000, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }"
    `);

  expect(gameState.at(-1)?.[1].units.get(from)?.label).toBe(3);
});

test('capture retains a label', () => {
  const from = vec(1, 1);
  const initialMap = map.copy({
    buildings: map.buildings.set(from, Barracks.create(player2, { label: 1 })),
    units: map.units.set(from, Pioneer.create(player1).capture()),
  });

  const [gameState] = executeGameActions(initialMap, [CaptureAction(from)]);

  const label = gameState.at(-1)?.[1].buildings.get(from)?.label;
  expect(label).toEqual(initialMap.buildings.get(from)?.label);
  expect(label).not.toBeNull();
});

test('drops labels from hidden win conditions', () => {
  const vecA = vec(1, 1);
  const vecB = vec(2, 1);
  const vecC = vec(3, 3);
  const initialMap = map.copy({
    buildings: map.buildings.set(vecA, Barracks.create(1, { label: 3 })),
    config: map.config.copy({
      objectives: ImmutableMap([
        [
          0,
          {
            hidden: true,
            label: new Set([3]),
            optional: false,
            type: Criteria.CaptureLabel,
          },
        ],
      ]),
    }),
    units: map.units
      .set(vecA, Pioneer.create(1, { label: 3 }))
      .set(
        vecB,
        Hovercraft.create(1).load(
          Jeep.create(1, { label: 2 })
            .load(Flamethrower.create(1, { label: 3 }).transport())
            .transport(),
        ),
      )
      .set(vecC, Helicopter.create(player2, { label: 2 })),
  });

  const mapA = dropLabels(initialMap);
  expect(mapA.units.get(vecA)!.label).toBeNull();
  expect(mapA.buildings.get(vecA)!.label).toBeNull();

  const hovercraft = mapA.units.get(vecB)!;
  const jeep = hovercraft.transports![0].deploy();
  expect(jeep.label).toBe(2);
  expect(jeep.transports![0].deploy().label).toBeNull();

  expect(mapA.units.get(vecC)!.label).toBe(2);
});
