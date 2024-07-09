import { CaptureAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import { Barracks } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Pioneer, SmallTank } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
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

test(`inserts 'ReceiveReward' action responses just before 'GameEnd'`, () => {
  const vecA = vec(1, 1);
  const vecB = vec(3, 3);
  const currentMap = map.copy({
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

  const [gameState] = executeGameActions(
    currentMap,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "SetViewer
    CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
    Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    ReceiveReward { player: 1, reward: 'Reward { skill: 4 }', permanent: null }
    GameEnd { objective: { amount: 1, hidden: false, optional: false, reward: { skill: 4, type: 'Skill' }, type: 2 }, objectiveId: 1, toPlayer: 1 }"
  `);
});

test(`each skill is only received once`, () => {
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

  const [gameState] = executeGameActions(
    currentMap,
    [CaptureAction(vecA)],
    effects,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "SetViewer
    CharacterMessage { message: 'Yay', player: 'self', unitId: 5, variant: 1 }
    Capture (1,1) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    ReceiveReward { player: 1, reward: 'Reward { skill: 4 }', permanent: null }
    GameEnd { objective: { amount: 1, hidden: false, optional: false, reward: { skill: 4, type: 'Skill' }, type: 2 }, objectiveId: 1, toPlayer: 1 }"
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
