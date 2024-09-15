import {
  CompleteUnitAction,
  DropUnitAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { execute } from '@deities/apollo/Action.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { decodeActionResponses } from '@deities/apollo/EncodedActions.tsx';
import { formatActionResponse } from '@deities/apollo/FormatActions.tsx';
import { Flamethrower, Humvee, Jeep } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, { h: 100, i: 1, p: 1 }],
      [5, 5, { h: 100, i: 1, p: 2 }],
    ],
    config: {
      fog: true,
    },
    map: [
      1, 8, 4, 8, 2, 8, 4, 4, 4, 8, 4, 4, 3, 4, 4, 8, 4, 4, 4, 8, 2, 8, 4, 8, 1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: 'User-1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, name: 'Test Player' }],
      },
    ],
    units: [
      [1, 1, { g: 40, h: 100, i: 1, p: 2 }],
      [2, 1, { g: 2, h: 100, i: 1, p: 1 }],
      [1, 2, { g: 40, h: 100, i: 1, p: 1 }],
      [5, 4, { g: 40, h: 100, i: 1, p: 2 }],
      [4, 2, { g: 40, h: 100, i: 1, p: 2 }],
    ],
  }),
);
const player1 = map.getPlayer(1);
const vision = map.createVisionObject(player1);

test('unit gets blocked by another unit in the fog', () => {
  const [actionResponse] = execute(
    map,
    vision,
    MoveAction(vec(1, 2), vec(4, 2)),
  )!;
  expect(
    formatActionResponse(actionResponse, { colors: false }),
  ).toMatchInlineSnapshot(
    `"Move (1,2 → 3,2) { fuel: 38, completed: true, path: [2,2 → 3,2] }"`,
  );
});

test('can only move when there is enough fuel', () => {
  expect(execute(map, vision, MoveAction(vec(2, 1), vec(2, 4)))).toBeNull();
});

test('transporters receive the correct unit in fog', async () => {
  const from = vec(3, 3);
  const to = vec(3, 2);
  let map = withModifiers(
    MapData.createMap({
      buildings: [
        [1, 1, { h: 100, i: 1, p: 1 }],
        [2, 1, { h: 100, i: 1, p: 2 }],
      ],
      config: {
        fog: true,
      },
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      round: 1,
      size: { height: 3, width: 4 },
      units: [
        [4, 2, { g: 40, h: 100, i: 1, p: 2 }],
        [3, 3, { g: 40, h: 100, i: 1, p: 2 }],
        [1, 2, { g: 40, h: 100, i: 1, p: 1 }],
        [3, 2, { g: 60, h: 100, i: 6, p: 2 }],
      ],
    }),
  );
  const vision = map.createVisionObject(player1);

  const [, gameActionResponse] = await executeGameActions(map, [
    EndTurnAction(),
    MoveAction(from, to),
    DropUnitAction(to, 0, vec(2, 2)),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      HiddenMove { path: [3,3 → 3,2], completed: false, fuel: 39, unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40 } }
      DropUnit (3,2 → 2,2) { index: 0 }"
    `);

  for (const actionResponse of decodeActionResponses(
    gameActionResponse[1]!.map(([actionResponse]) => actionResponse),
  )) {
    map = applyActionResponse(map, vision, actionResponse);
  }

  const unit = map.units.get(vec(2, 2))!;
  expect([unit.info.name, unit.format()]).toMatchInlineSnapshot(`
    [
      "Pioneer",
      {
        "completed": true,
        "fuel": 39,
        "health": 100,
        "id": 1,
        "moved": true,
        "player": 2,
      },
    ]
  `);
});

test('transporters can be loaded even if they are completed', async () => {
  const from = vec(3, 3);
  const to = vec(3, 2);
  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      round: 1,
      size: { height: 3, width: 4 },
      units: [
        [4, 2, { g: 40, h: 100, i: 1, p: 2 }],
        [3, 3, { g: 40, h: 100, i: 1, p: 2 }],
        [1, 2, { g: 40, h: 100, i: 1, p: 1 }],
        [3, 2, { g: 60, h: 100, i: 6, p: 2 }],
      ],
    }),
  );
  const [, gameActionResponse] = await executeGameActions(map, [
    EndTurnAction(),
    CompleteUnitAction(to),
    MoveAction(from, to),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 0, player: 1 }, next: { funds: 0, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      CompleteUnit (3,2)
      Move (3,3 → 3,2) { fuel: 39, completed: false, path: [3,2] }"
    `);
});

test('units use the correct amount of fuel with custom paths', () => {
  const mapA = map.copy({
    map: Array(map.map.length).fill(1),
    units: map.units.set(vec(1, 2), Humvee.create(1)),
  });
  const [actionResponseA] = execute(
    mapA,
    vision,
    MoveAction(vec(1, 2), vec(3, 1)),
  )!;
  expect(
    formatActionResponse(actionResponseA, { colors: false }),
  ).toMatchInlineSnapshot(
    `"Move (1,2 → 3,1) { fuel: 47, completed: null, path: [2,2 → 2,1 → 3,1] }"`,
  );

  const [actionResponseB] = execute(
    mapA,
    vision,
    MoveAction(vec(1, 2), vec(3, 1), [
      vec(2, 2),
      vec(2, 3),
      vec(3, 3),
      vec(3, 2),
      vec(3, 1),
    ]),
  )!;
  expect(
    formatActionResponse(actionResponseB, { colors: false }),
  ).toMatchInlineSnapshot(
    `"Move (1,2 → 3,1) { fuel: 45, completed: null, path: [2,2 → 2,3 → 3,3 → 3,2 → 3,1] }"`,
  );
});

test('units can be loaded into transporters', () => {
  const from = vec(1, 2);
  const to = vec(3, 2);
  const mapA = map.copy({
    map: Array(map.map.length).fill(1),
    units: map.units.set(from, Flamethrower.create(1)).set(to, Jeep.create(1)),
  });

  const [actionResponseA] = execute(
    mapA,
    vision,
    MoveAction(from, to, [vec(2, 2), vec(2, 3), vec(3, 3), to]),
  )!;
  expect(
    formatActionResponse(actionResponseA, { colors: false }),
  ).toMatchInlineSnapshot(
    `"Move (1,2 → 3,2) { fuel: 26, completed: null, path: [2,2 → 2,3 → 3,3 → 3,2] }"`,
  );

  const mapB = mapA.copy({
    units: map.units.set(to, Jeep.create(2)),
  });

  expect(
    execute(
      mapB,
      vision,
      MoveAction(from, to, [vec(2, 2), vec(2, 3), vec(3, 3), to]),
    ),
  ).toBeNull();
});
