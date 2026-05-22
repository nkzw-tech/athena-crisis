import {
  AttackUnitAction,
  CaptureAction,
  EndTurnAction,
  MoveAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { execute } from '@deities/apollo/Action.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import { House, HQ } from '@deities/athena/info/Building.tsx';
import { Mountain, Plain, Sea } from '@deities/athena/info/Tile.tsx';
import {
  APU,
  Artillery,
  Helicopter,
  Infantry,
  Pioneer,
  Sniper,
  TransportHelicopter,
} from '@deities/athena/info/Unit.tsx';
import updateSeen from '@deities/athena/lib/updateSeen.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Fog } from '@deities/athena/map/PlainMap.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import { moveable } from '@deities/athena/Radius.tsx';
import { StandardFog, Visibility, type VisionT } from '@deities/athena/Vision.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import getMoveableFields from '../../hera/behavior/move/getMoveableFields.tsx';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import {
  captureGameActionResponse,
  captureOne,
  getMainFogCanvasAlphaSummary,
} from '../screenshot.tsx';
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
    map: [1, 1, 1, 3, 2, 1, 1, 1, 3, 1, 1, 2, 3, 1, 3, 1, 1, 1, 1, 1, 1, 2, 3, 1, 1],
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, userId: '2' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test('hard fog keeps the soft edge fade on floating maps', async () => {
  const boundaryMap = withModifiers(
    MapData.createMap({
      config: {
        fog: true,
      },
      map: Array(81).fill(Plain.id),
      size: { height: 9, width: 9 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
      ],
      units: [[5, 5, Pioneer.create(1).toJSON()]],
    }),
  );
  const hardScreenshot = await captureOne(boundaryMap, player1.userId, {
    fogStyle: 'hard',
    style: 'floating',
  });
  const hardAlpha = await getMainFogCanvasAlphaSummary();
  const softScreenshot = await captureOne(boundaryMap, player1.userId, {
    fogStyle: 'soft',
    style: 'floating',
  });
  const softAlpha = await getMainFogCanvasAlphaSummary();

  expect(hardAlpha).toMatchInlineSnapshot(`
    {
      "fogStyle": "hard",
      "height": 264,
      "innerUniqueAlphaCount": 2,
      "uniqueAlphaCount": 107,
      "width": 264,
    }
  `);
  expect(softAlpha).toMatchInlineSnapshot(`
    {
      "fogStyle": "soft",
      "height": 264,
      "innerUniqueAlphaCount": 235,
      "uniqueAlphaCount": 243,
      "width": 264,
    }
  `);
  expect(hardScreenshot).not.toEqual(softScreenshot);

  printGameState('Hard Fog', hardScreenshot);
  expect(hardScreenshot).toMatchImageSnapshot();
});

test('units that will be supplied by a hidden adjacent supply unit are not destroyed on the client', async () => {
  const initialMap: MapData | null = map.copy({
    units: map.units
      .set(vec(2, 4), Pioneer.create(1))
      .set(vec(4, 4), Helicopter.create(2).setFuel(1))
      .set(vec(5, 4), TransportHelicopter.create(2).setFuel(10)),
  });
  const [, gameActionResponse] = await executeGameActions(initialMap, [
    EndTurnAction(),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: [4,4], miss: false }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  gameActionResponse[1]!.map(([, , units]) => expect(units).toBeUndefined());
});

test('capturing an opponent HQ will reveal nearby units and buildings', async () => {
  const helicopterVec = vec(1, 3);
  const initialMap = map.copy({
    active: [...map.active, 3],
    buildings: map.buildings.set(vec(1, 5), HQ.create(3)).set(vec(1, 4), House.create(2)),
    teams: map.teams.set(
      3,
      new Team(
        3,
        '',
        ImmutableMap([
          [
            3,
            new HumanPlayer(
              3,
              'User-6',
              3,
              500,
              undefined,
              new Set(),
              new Set(),
              0,
              null,
              0,
              null,
              null,
            ),
          ],
        ]),
      ),
    ),
    units: map.units
      .set(helicopterVec, Helicopter.create(3))
      .set(vec(5, 5), Pioneer.create(1).capture())
      .set(vec(4, 4), Helicopter.create(2)),
  });
  const [gameState, gameActionResponse] = await executeGameActions(initialMap, [
    CaptureAction(vec(5, 5)),
    EndTurnAction(),
    EndTurnAction(),
  ]);
  const actionResponses = gameActionResponse[1]!;
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "Capture (5,5) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
      CaptureGameOver { fromPlayer: 2, toPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 3 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      EndTurn { current: { funds: 500, player: 3 }, next: { funds: 600, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);

  expect(actionResponses[0][1]).toBeUndefined();
  expect(actionResponses[0][2]).toBeUndefined();

  expect(actionResponses[1][1]).toMatchInlineSnapshot(`
    [
      [
        1,
        5,
        {
          "h": 100,
          "i": 1,
          "p": 3,
        },
      ],
      [
        1,
        4,
        {
          "h": 100,
          "i": 2,
          "p": 1,
        },
      ],
    ]
  `);
  expect(actionResponses[1][2]).toMatchInlineSnapshot(`
    [
      [
        1,
        3,
        {
          "a": [
            [
              1,
              8,
            ],
          ],
          "g": 40,
          "h": 100,
          "i": 9,
          "p": 3,
        },
      ],
    ]
  `);

  for (let i = 2; i < actionResponses.length; i++) {
    expect(actionResponses[i][1]).toBeUndefined();
    expect(actionResponses[i][2]).toBeUndefined();
  }

  expect(gameState.at(-1)![1].units.get(helicopterVec)!.fuel).toBeLessThan(
    initialMap.units.get(helicopterVec)!.fuel,
  );
});

test('neutralizes the opponent HQ when it is no longer visible', async () => {
  const from = vec(4, 5);
  const to = vec(5, 5);
  const initialMap = map.copy({
    units: map.units
      .set(vec(1, 1), Pioneer.create(1))
      .set(from, Helicopter.create(2))
      .set(to, Pioneer.create(1).setHealth(1)),
  });

  const [, gameActionResponse] = await executeGameActions(initialMap, [
    EndTurnAction(),
    AttackUnitAction(from, to),
    EndTurnAction(),
  ]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );
  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (4,5 → 5,5) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100, ammo: [ [ 1, 7 ] ] }, unitB: null, chargeA: 0, chargeB: 1 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('nearby tiles are always visible regardless of vision cost', () => {
  const initialMap: MapData | null = map.copy({
    units: map.units.set(vec(3, 1), Sniper.create(1)),
  });

  const vision = initialMap.createVisionObject(player1);

  // The mountain next to the Sniper has a higher vision cost than the Sniper has vision.
  // This test verifies that the tile is visible regardless.
  expect(vision.isVisible(initialMap, vec(4, 1))).toBeTruthy();
});

test(`visible radius doesn't wrap around the map`, async () => {
  const initialMap: MapData | null = map.copy({
    units: map.units.set(vec(5, 2), APU.create(1)),
  });

  const vision = initialMap.createVisionObject(player1);
  expect(vision.isVisible(initialMap, vec(1, 3))).not.toBeTruthy();
});

test(`a unit that gets blocked and issues a 'HiddenMove' action is marked as completed`, async () => {
  const from = vec(4, 4);
  const to = vec(2, 3);
  const initialMap: MapData | null = map.copy({
    units: map.units.set(to, Pioneer.create(1)).set(from, Helicopter.create(2)),
  });
  const [, gameActionResponse] = await executeGameActions(initialMap, [
    EndTurnAction(),
    MoveAction(from, to),
  ]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );

  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      HiddenMove { path: [4,4 → 3,4 → 2,4], completed: true, fuel: 37, unit: Helicopter { id: 9, health: 100, player: 2, fuel: 39, ammo: [ [ 1, 8 ] ] } }"
    `);
});

test(`hidden labels are dropped from buildings and units`, async () => {
  const from = vec(2, 2);
  const to = vec(3, 3);
  const vecA = vec(4, 3);
  const vecB = vec(3, 4);
  const initialMap: MapData | null = map.copy({
    buildings: map.buildings.set(vecB, House.create(2, { label: 2 })),
    config: map.config.copy({
      objectives: map.config.objectives
        .set(1, {
          hidden: true,
          label: new Set([2]),
          optional: false,
          type: Criteria.CaptureLabel,
        })
        .set(2, {
          hidden: true,
          label: new Set([2]),
          optional: false,
          type: Criteria.DefeatLabel,
        }),
    }),
    units: map.units.set(from, Infantry.create(1)).set(vecA, Helicopter.create(2, { label: 2 })),
  });
  const [, gameActionResponse] = await executeGameActions(initialMap, [MoveAction(from, to)]);
  const screenshot = await captureGameActionResponse(
    initialMap,
    gameActionResponse,
    player1.userId,
  );

  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('exploration fog keeps previously seen fields in regular fog after moving', async () => {
  const from = vec(1, 1);
  const to = vec(4, 1);
  const initialMap = updateSeen(
    withModifiers(
      MapData.createMap({
        config: {
          fog: Fog.Exploration,
        },
        map: Array(25).fill(1),
        size: { height: 5, width: 5 },
        units: [[1, 1, Pioneer.create(1).toJSON()]],
      }),
    ),
  );

  expect(initialMap.createVisionObject(1).getVisibility(initialMap, vec(5, 5))).toBe(
    Visibility.Unexplored,
  );

  const [gameState] = await executeGameActions(initialMap, [MoveAction(from, to)]);
  const finalMap = gameState.at(-1)![1];
  const vision = finalMap.createVisionObject(1);

  expect(vision.getVisibility(finalMap, from)).toBe(Visibility.Fog);
  expect(vision.getVisibility(finalMap, to)).toBe(Visibility.Visible);
  expect(vision.getVisibility(finalMap, vec(5, 1))).toBe(Visibility.Visible);
  expect(vision.getVisibility(finalMap, vec(5, 5))).toBe(Visibility.Unexplored);
  expect(finalMap.getPlayer(1).seen.has(finalMap.getTileIndex(from))).toBe(true);
  expect(finalMap.getPlayer(1).seen.has(finalMap.getTileIndex(vec(5, 1)))).toBe(true);
});

test('exploration fog is shared by players on the same team', async () => {
  const from = vec(1, 1);
  const to = vec(4, 1);
  const teamMap = MapData.createMap({
    active: [1, 2, 3],
    config: {
      fog: Fog.Exploration,
    },
    map: Array(25).fill(1),
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 3, userId: '3' },
        ],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 0, id: 2, userId: '2' }],
      },
    ],
    units: [[1, 1, Pioneer.create(1).toJSON()]],
  });
  const initialMap = updateSeen(withModifiers(teamMap));

  const [gameState] = await executeGameActions(initialMap, [MoveAction(from, to)]);
  const finalMap = gameState.at(-1)![1];
  const teammateVision = finalMap.createVisionObject(3);
  const opponentVision = finalMap.createVisionObject(2);

  expect(finalMap.getPlayer(3).seen.has(finalMap.getTileIndex(vec(5, 1)))).toBe(true);
  expect(teammateVision.getVisibility(finalMap, from)).toBe(Visibility.Fog);
  expect(teammateVision.getVisibility(finalMap, to)).toBe(Visibility.Visible);
  expect(opponentVision.getVisibility(finalMap, vec(5, 1))).toBe(Visibility.Unexplored);
});

test('exploration fog movement planning does not reveal unexplored terrain constraints', () => {
  const from = vec(1, 1);
  const hiddenMountain = vec(3, 1);
  const initialMap = updateSeen(
    withModifiers(
      MapData.createMap({
        config: {
          fog: Fog.Exploration,
        },
        map: [Plain.id, Plain.id, Mountain.id, Plain.id, Plain.id],
        size: { height: 1, width: 5 },
        units: [[1, 1, Artillery.create(1).toJSON()]],
      }),
    ),
  );
  const vision = initialMap.createVisionObject(1);
  const unit = initialMap.units.get(from)!;

  expect(vision.getVisibility(initialMap, hiddenMountain)).toBe(Visibility.Unexplored);
  expect(moveable(vision.apply(initialMap), unit, from).has(hiddenMountain)).toBe(false);
  expect(getMoveableFields(initialMap, vision, unit, from).has(hiddenMountain)).toBe(true);
});

test('exploration fog keeps move-and-act units available after a valid move into the veil', () => {
  const from = vec(1, 1);
  const to = vec(4, 1);
  const initialMap = updateSeen(
    withModifiers(
      MapData.createMap({
        config: {
          fog: Fog.Exploration,
        },
        map: Array(5).fill(Plain.id),
        size: { height: 1, width: 5 },
        units: [[1, 1, Artillery.create(1).toJSON()]],
      }),
    ),
  );
  const path = [vec(2, 1), vec(3, 1), to];
  const result = execute(initialMap, initialMap.createVisionObject(1), MoveAction(from, to, path));

  expect(result).not.toBeNull();
  const [actionResponse, newMap] = result!;
  expect(actionResponse).toMatchObject({
    fuel: Artillery.configuration.fuel - 3,
    path,
    to,
    type: 'Move',
  });
  expect(actionResponse).not.toHaveProperty('completed');
  expect(newMap.units.get(to)?.hasMoved()).toBe(true);
  expect(newMap.units.get(to)?.isCompleted()).toBe(false);
});

test('exploration fog stops a theoretical move at hidden terrain blockers', () => {
  const from = vec(1, 1);
  const expectedTo = vec(2, 1);
  const blockedBy = vec(3, 1);
  const initialMap = updateSeen(
    withModifiers(
      MapData.createMap({
        config: {
          fog: Fog.Exploration,
        },
        map: [Plain.id, Plain.id, Sea.id, Plain.id, Plain.id],
        size: { height: 1, width: 5 },
        units: [[1, 1, Artillery.create(1).toJSON()]],
      }),
    ),
  );
  const vision = initialMap.createVisionObject(1);
  const path = [expectedTo, blockedBy, vec(4, 1)];
  const result = execute(initialMap, vision, MoveAction(from, vec(4, 1), path));

  expect(vision.getVisibility(initialMap, blockedBy)).toBe(Visibility.Unexplored);
  expect(result).not.toBeNull();
  const [actionResponse, newMap] = result!;
  expect(actionResponse).toMatchObject({
    completed: true,
    fuel: Artillery.configuration.fuel - 1,
    path: [expectedTo],
    to: expectedTo,
    type: 'Move',
  });
  expect(newMap.units.get(expectedTo)?.isCompleted()).toBe(true);
});

test('exploration fog rejects crafted moves over explored fogged terrain blockers', () => {
  const from = vec(1, 1);
  const blockedBy = vec(3, 1);
  const initialMap = withModifiers(
    MapData.createMap({
      config: {
        fog: Fog.Exploration,
      },
      map: [Plain.id, Plain.id, Sea.id, Plain.id, Plain.id],
      size: { height: 1, width: 5 },
      teams: [
        {
          id: 1,
          name: '',
          players: [
            {
              funds: 0,
              id: 1,
              seen: [1 << 2],
              userId: '1',
            },
          ],
        },
      ],
      units: [[1, 1, Artillery.create(1).toJSON()]],
    }),
  );
  const vision = initialMap.createVisionObject(1);

  expect(vision.getVisibility(initialMap, blockedBy)).toBe(Visibility.Fog);
  expect(
    execute(initialMap, vision, MoveAction(from, vec(4, 1), [vec(2, 1), blockedBy, vec(4, 1)])),
  ).toBeNull();
});

test('exploration fog visible updates tolerate entities whose team accumulator is missing', () => {
  const map = MapData.createMap({
    buildings: [[1, 1, House.create(1).toJSON()]],
    config: {
      fog: Fog.Exploration,
    },
    map: [Plain.id],
    size: { height: 1, width: 1 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: '1' }],
      },
    ],
  });
  const player = map.getPlayer(1).copy({ teamId: 2 });
  const clientMap = map.copy({
    teams: ImmutableMap([[1, new Team(1, '', ImmutableMap([[1, player]]))]]),
  });
  const vision: VisionT = {
    apply: (map) => map,
    currentViewer: 1,
    getVisibility: () => Visibility.Visible,
    isExplored: () => true,
    isVisible: () => true,
  };

  expect(() => updateVisibleEntities(clientMap, vision, {})).not.toThrow();
});

test('exploration fog does not serialize opponent seen tiles in fogged state', () => {
  const teamMap = MapData.createMap({
    active: [1, 2, 3],
    config: {
      fog: Fog.Exploration,
    },
    map: Array(25).fill(1),
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 3, userId: '3' },
        ],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 0, id: 2, userId: '2' }],
      },
    ],
    units: [
      [1, 1, Pioneer.create(1).toJSON()],
      [5, 5, Pioneer.create(2).toJSON()],
    ],
  });
  const initialMap = updateSeen(withModifiers(teamMap));
  const foggedJSON = initialMap.createVisionObject(1).apply(initialMap).toJSON();
  const [teamA, teamB] = foggedJSON.teams;

  expect(teamA?.players[0]?.seen).toBeDefined();
  expect(teamA?.players[1]?.seen).toBeDefined();
  expect(teamB?.players[0]?.seen).toBeUndefined();
});

test('standard fog vision treats exploration fog tiles as explored for editor previews', () => {
  const editorMap = withModifiers(
    MapData.createMap({
      buildings: [[1, 1, House.create(1).toJSON()]],
      config: {
        fog: Fog.Exploration,
      },
      map: Array(25).fill(1),
      size: { height: 5, width: 5 },
      units: [[1, 1, Pioneer.create(1).toJSON()]],
    }),
  );
  const regularVision = editorMap.createVisionObject(1);
  const editorVision = new StandardFog(1);

  expect(regularVision.isVisible(editorMap, vec(1, 1))).toBe(true);
  expect(regularVision.isExplored(editorMap, vec(1, 1))).toBe(false);
  expect(editorVision.getVisibility(editorMap, vec(1, 1))).toBe(Visibility.Visible);
  expect(editorVision.getVisibility(editorMap, vec(5, 5))).toBe(Visibility.Fog);
});
