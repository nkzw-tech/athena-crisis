import {
  AttackBuildingAction,
  AttackUnitAction,
  CaptureAction,
  CreateBuildingAction,
  CreateUnitAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import { Barracks, House } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { ConstructionSite } from '@deities/athena/info/Tile.tsx';
import {
  APU,
  Flamethrower,
  HeavyArtillery,
  HeavyTank,
  Helicopter,
  Humvee,
  Infantry,
  Pioneer,
  Sniper,
} from '@deities/athena/info/Unit.tsx';
import indexToVector from '@deities/athena/lib/indexToSpriteVector.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Bot, HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Fog } from '@deities/athena/Vision.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, userId: '4' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const player2 = HumanPlayer.from(map.getPlayer(2), '4');

test('collects statistics on attacks', async () => {
  const fromA = vec(1, 1);
  const toA = vec(1, 2);
  const fromB = vec(1, 3);
  const toB = vec(2, 3);
  const fromC = vec(3, 1);
  const toC = vec(3, 2);
  const initialMap = map.copy({
    units: map.units
      .set(fromA, Helicopter.create(player1))
      .set(toA, Helicopter.create(player2).setHealth(20))
      .set(fromB, Helicopter.create(player1).setHealth(10))
      .set(toB, Helicopter.create(player2))
      .set(fromC, Flamethrower.create(player1))
      .set(toC, Pioneer.create(player2))
      .set(vec(3, 3), Helicopter.create(player2)),
  });

  const [gameState] = executeGameActions(initialMap, [
    AttackUnitAction(fromA, toA),
    AttackUnitAction(fromB, toB),
    AttackUnitAction(fromC, toC),
  ]);

  const lastMap = gameState.at(-1)![1];
  const statsA = lastMap.getPlayer(player1.id).stats;
  const statsB = lastMap.getPlayer(player2.id).stats;

  expect(statsA.damage).toBeGreaterThan(1);
  expect({ ...statsA, damage: 0 }).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 2,
      "lostBuildings": 0,
      "lostUnits": 1,
      "oneShots": 1,
      "rescuedUnits": 0,
    }
  `);
  expect(statsB).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 10,
      "destroyedBuildings": 0,
      "destroyedUnits": 1,
      "lostBuildings": 0,
      "lostUnits": 2,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);

  // Stats for other players in fog are not visible.
  const fogMap = new Fog(player1.id).apply(lastMap);
  expect({ ...fogMap.getPlayer(player1.id).stats, damage: 0 })
    .toMatchInlineSnapshot(`
      {
        "captured": 0,
        "createdBuildings": 0,
        "createdUnits": 0,
        "damage": 0,
        "destroyedBuildings": 0,
        "destroyedUnits": 2,
        "lostBuildings": 0,
        "lostUnits": 1,
        "oneShots": 1,
        "rescuedUnits": 0,
      }
    `);
  expect(fogMap.getPlayer(player2.id).stats).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 0,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);
});

test('one shots work through counter attacks', async () => {
  const fromA = vec(1, 1);
  const toA = vec(1, 2);
  const skills = new Set([Skill.UnitAPUAttackIncreaseMajorPower]);
  const initialMap = map.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({
        activeSkills: skills,
        skills,
      }),
    ),
    units: map.units
      .set(fromA, Infantry.create(player1))
      .set(toA, APU.create(player2)),
  });

  const [gameState] = executeGameActions(initialMap, [
    AttackUnitAction(fromA, toA),
  ]);

  const lastMap = gameState.at(-1)![1];
  const statsA = lastMap.getPlayer(player1.id).stats;
  const statsB = lastMap.getPlayer(player2.id).stats;

  expect(statsA.damage).toBeGreaterThan(1);
  expect({ ...statsA, damage: 0 }).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 1,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);
  expect(statsB).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 100,
      "destroyedBuildings": 0,
      "destroyedUnits": 1,
      "lostBuildings": 0,
      "lostUnits": 0,
      "oneShots": 1,
      "rescuedUnits": 0,
    }
  `);
});

test('collects statistics when attacking buildings', async () => {
  const fromA = vec(1, 1);
  const toA = vec(1, 2);
  const initialMap = map.copy({
    active: [...map.active, 3],
    buildings: map.buildings.set(toA, House.create(player2)),
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
              '3',
              3,
              300,
              undefined,
              new Set(),
              new Set(),
              0,
              null,
              0,
            ),
          ],
        ]),
      ),
    ),
    units: map.units
      .set(fromA, HeavyTank.create(player1))
      .set(toA, Helicopter.create(3).setHealth(20))
      .set(vec(3, 3), Pioneer.create(player2)),
  });

  const [gameState] = executeGameActions(initialMap, [
    AttackBuildingAction(fromA, toA),
    EndTurnAction(),
    EndTurnAction(),
    EndTurnAction(),
    AttackBuildingAction(fromA, toA),
  ]);

  const lastMap = gameState.at(-1)![1];
  const statsA = lastMap.getPlayer(player1.id).stats;
  const statsB = lastMap.getPlayer(player2.id).stats;
  const statsC = lastMap.getPlayer(3).stats;
  expect(statsA).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 100,
      "destroyedBuildings": 1,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 0,
      "oneShots": 1,
      "rescuedUnits": 0,
    }
  `);
  expect(statsB.lostBuildings).toEqual(1);
  expect(statsC.damage).toBeGreaterThan(1);
  expect({ ...statsC, damage: 0 }).toMatchInlineSnapshot(`
    {
      "captured": 0,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 1,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);
});

test('collects statistics on captures and creating units', async () => {
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(1, 3);
  const vecD = vec(2, 3);
  const initialMap = map.copy({
    buildings: map.buildings
      .set(vecA, House.create(player2))
      .set(vecD, Barracks.create(player1)),
    map: map.map.map((tile, index) =>
      indexToVector(index, map.size.width).equals(vecC)
        ? ConstructionSite.id
        : tile,
    ),
    units: map.units
      .set(vecA, Pioneer.create(player1).capture())
      .set(vecB, Helicopter.create(player2))
      .set(vecC, Pioneer.create(player1)),
  });

  const [gameState] = executeGameActions(initialMap, [
    CaptureAction(vecA),
    CreateBuildingAction(vecC, House.id),
    CreateUnitAction(vecD, Pioneer.id, vecD),
  ]);

  const statsA = gameState.at(0)![1].getPlayer(player1.id).stats;
  const statsB = gameState.at(1)![1].getPlayer(player1.id).stats;
  const statsC = gameState.at(2)![1].getPlayer(player1.id).stats;

  expect(statsA).toMatchInlineSnapshot(`
    {
      "captured": 1,
      "createdBuildings": 0,
      "createdUnits": 0,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 0,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);

  expect(statsB).toMatchInlineSnapshot(`
    {
      "captured": 1,
      "createdBuildings": 1,
      "createdUnits": 0,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 0,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);
  expect(statsC).toMatchInlineSnapshot(`
    {
      "captured": 1,
      "createdBuildings": 1,
      "createdUnits": 1,
      "damage": 0,
      "destroyedBuildings": 0,
      "destroyedUnits": 0,
      "lostBuildings": 0,
      "lostUnits": 0,
      "oneShots": 0,
      "rescuedUnits": 0,
    }
  `);
});

test('tracks statistics for players of the same team in fog', async () => {
  const vision = new Fog(player1.id);

  const vecA = vec(1, 1);
  const vecB = vec(3, 1);
  const vecC = vec(2, 3);
  const vecD = vec(3, 3);
  const initialMap = applyActionResponse(
    map.copy({
      config: map.config.copy({ fog: true }),
      units: map.units
        .set(vecA, Sniper.create(player1))
        .set(vecC, HeavyArtillery.create(player2))
        .set(vecD, Humvee.create(player2)),
    }),
    vision,
    {
      teams: ImmutableMap([
        [
          1,
          new Team(
            1,
            '',
            ImmutableMap([
              [
                3,
                new Bot(
                  3,
                  'Bot',
                  1,
                  300,
                  undefined,
                  new Set(),
                  new Set(),
                  0,
                  null,
                  0,
                ),
              ],
            ]),
          ),
        ],
      ]),
      type: 'Spawn',
      units: ImmutableMap([[vecB, Sniper.create(3).setHealth(10)]]),
    },
  );

  const [gameState, encodedGameActionResponse] = executeGameActions(
    initialMap,
    [EndTurnAction(), AttackUnitAction(vecC, vecB)],
  );

  const { others } = decodeGameActionResponse(encodedGameActionResponse);

  let fogMap = applyActionResponse(
    vision.apply(initialMap),
    vision,
    others![0].actionResponse,
  );
  for (const { actionResponse, buildings, units } of others!) {
    fogMap = updateVisibleEntities(
      applyActionResponse(fogMap, vision, actionResponse),
      vision,
      {
        buildings,
        units,
      },
    );
  }

  const lastMap = gameState.at(-1)![1];
  const player2StatsA = lastMap.getPlayer(2).stats;
  const player2StatsB = fogMap.getPlayer(2).stats;
  const player3StatsA = lastMap.getPlayer(3).stats;
  const player3StatsB = fogMap.getPlayer(3).stats;

  expect(player3StatsA).toEqual(player3StatsB);

  // Hide stats from other players due to fog.
  expect(player2StatsA.damage).toBeGreaterThan(0);
  expect(player2StatsB.damage).toEqual(0);
  expect(player2StatsA).not.toEqual(player2StatsB);
});

test('increases the `destroyedUnits` count of other players when a unit self-destructs', async () => {
  const fromA = vec(1, 1);
  const toA = vec(1, 2);
  const fromB = vec(1, 3);
  const toB = vec(2, 3);
  const initialMap = map.copy({
    teams: map.teams.set(
      3,
      new Team(
        3,
        '',
        ImmutableMap([
          [
            3,
            new Bot(
              3,
              'Bot',
              3,
              300,
              undefined,
              new Set(),
              new Set(),
              0,
              null,
              0,
            ),
          ],
        ]),
      ),
    ),
    units: map.units
      .set(fromA, Helicopter.create(player1))
      .set(toA, Helicopter.create(player2).setFuel(1))
      .set(fromB, Helicopter.create(player2))
      .set(toB, Helicopter.create(3)),
  });

  const [gameState] = executeGameActions(initialMap, [EndTurnAction()]);

  const lastMap = gameState.at(-1)![1];
  const statsA = lastMap.getPlayer(player1.id).stats;
  const statsB = lastMap.getPlayer(player2.id).stats;
  const statsC = lastMap.getPlayer(3).stats;

  expect(statsA.destroyedUnits).toBe(1);
  expect(statsB.destroyedUnits).toBe(0);
  expect(statsC.destroyedUnits).toBe(0);
});
