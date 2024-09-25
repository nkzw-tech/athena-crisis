import { CaptureAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import { Barracks } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Pioneer, SmallTank } from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Bot, HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotGameState from '../snapshotGameState.tsx';

const map = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 10_000, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, name: 'Bot' }],
      },
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

test(`inserts 'ReceiveReward' action responses just before 'GameEnd'`, async () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const mapA = map.copy({
    buildings: map.buildings.set(vecA, Barracks.create(2)),
    config: map.config.copy({
      objectives: ImmutableMap([
        [
          0,
          {
            hidden: false,
            type: Criteria.Default,
          },
        ],
        [
          1,
          {
            amount: 1,
            hidden: false,
            optional: false,
            reward: {
              skill: Skill.BuyUnitCannon,
              type: 'Skill',
            },
            type: Criteria.CaptureAmount,
          },
        ],
      ]),
    }),
    units: map.units
      .set(vecA, Pioneer.create(player1).capture())
      .set(vecB, SmallTank.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'GameEnd',
      new Set<Effect>([
        {
          actions: [
            {
              message: `I win again!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 'win',
            },
          ],
        },
        {
          actions: [
            {
              message: `Yay`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 1,
            },
          ],
        },
      ]),
    ],
  ]);

  const [gameStateA] = await executeGameActions(
    mapA,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotGameState(gameStateA)).toMatchInlineSnapshot(`
    "SetPlayer { player: 1 }
    CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
    Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    ReceiveReward { player: 1, reward: 'Reward { skill: 4 }', permanent: null }
    GameEnd { objective: { amount: 1, hidden: false, optional: false, reward: { skill: 4, type: 'Skill' }, type: 2 }, objectiveId: 1, toPlayer: 1, chaosStars: null }"
  `);

  // Bots do not receive rewards at the end of a game.
  const mapB = mapA.copy({
    teams: updatePlayer(map.teams, Bot.from(player1, 'Bot')),
  });

  const [gameStateB] = await executeGameActions(
    mapB,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotGameState(gameStateB)).toMatchInlineSnapshot(`
    "Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    SetPlayer { player: 1 }
    CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
    GameEnd { objective: { amount: 1, hidden: false, optional: false, reward: { skill: 4, type: 'Skill' }, type: 2 }, objectiveId: 1, toPlayer: 1, chaosStars: null }"
  `);

  // Inactive players do not receive rewards.
  const team1 = map.getTeam(1);
  const mapC = mapA.copy({
    teams: map.teams.set(
      1,
      team1.copy({
        players: team1.players.set(3, player1.copy({ id: 3, userId: '3' })),
      }),
    ),
  });

  const [gameStateC] = await executeGameActions(
    mapC,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotGameState(gameStateC)).toMatchInlineSnapshot(`
    "SetPlayer { player: 1 }
    CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
    Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    ReceiveReward { player: 1, reward: 'Reward { skill: 4 }', permanent: null }
    GameEnd { objective: { amount: 1, hidden: false, optional: false, reward: { skill: 4, type: 'Skill' }, type: 2 }, objectiveId: 1, toPlayer: 1, chaosStars: null }"
  `);
});

test(`each skill is only received once`, async () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const reward = {
    skill: Skill.BuyUnitCannon,
    type: 'Skill',
  } as const;
  const currentMap = map.copy({
    buildings: map.buildings.set(vecA, Barracks.create(2)),
    config: map.config.copy({
      objectives: ImmutableMap([
        [
          0,
          {
            hidden: false,
            reward,
            type: Criteria.Default,
          },
        ],
        [
          1,
          {
            amount: 1,
            hidden: false,
            optional: false,
            reward,
            type: Criteria.CaptureAmount,
          },
        ],
      ]),
    }),
    units: map.units
      .set(vecA, Pioneer.create(player1).capture())
      .set(vecB, SmallTank.create(2).setHealth(1)),
  });

  const effects: Effects = new Map([
    [
      'GameEnd',
      new Set<Effect>([
        {
          actions: [
            {
              message: `I win again!`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 'win',
            },
          ],
        },
        {
          actions: [
            {
              message: `Yay`,
              player: 'self',
              type: 'CharacterMessageEffect',
              unitId: SmallTank.id,
              variant: 1,
            },
          ],
          conditions: [
            {
              type: 'GameEnd',
              value: 1,
            },
          ],
        },
      ]),
    ],
  ]);

  const [gameState] = await executeGameActions(
    currentMap,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "SetPlayer { player: 1 }
    CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
    Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    ReceiveReward { player: 1, reward: 'Reward { skill: 4 }', permanent: null }
    GameEnd { objective: { amount: 1, hidden: false, optional: false, reward: { skill: 4, type: 'Skill' }, type: 2 }, objectiveId: 1, toPlayer: 1, chaosStars: null }"
  `);
});

test('receiving skill rewards during a game will add them to the player', async () => {
  const newMap = applyActionResponse(map, map.createVisionObject(player1), {
    player: 1,
    reward: {
      skill: Skill.BuyUnitCannon,
      type: 'Skill',
    },
    type: 'ReceiveReward',
  } as const);

  expect(newMap.getPlayer(1).skills).toMatchInlineSnapshot(`
    Set {
      4,
    }
  `);
  expect(newMap.getPlayer(2).skills).toMatchInlineSnapshot(`Set {}`);
});
