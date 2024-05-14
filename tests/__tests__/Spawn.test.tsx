import { executeEffect } from '@deities/apollo/Action.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import { Bomber, FighterJet, Helicopter } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Bot, HumanPlayer } from '@deities/athena/map/Player.tsx';
import Team from '@deities/athena/map/Team.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import { printGameState } from '../printGameState.tsx';
import { captureGameActionResponse, captureGameState } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const map = withModifiers(
  MapData.createMap({
    config: {
      fog: true,
    },
    map: [
      1, 1, 3, 1, 3, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 3, 1, 3, 1, 1, 2, 2, 2, 1, 1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, name: 'AI' }] },
    ],
    units: [[2, 1, { g: 40, h: 100, i: 1, p: 1 }]],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const team1 = map.getTeam(player1);

test('spawns units and adds new players', async () => {
  const vision = map.createVisionObject(player1);
  const gameStateEntry = executeEffect(map, vision, {
    teams: ImmutableMap([
      [
        1,
        team1.copy({
          players: ImmutableMap([
            [
              4,
              new Bot(
                4,
                'Test Player',
                1,
                500,
                undefined,
                new Set(),
                new Set(),
                0,
                null,
                0,
              ),
            ],
          ]),
        }),
      ],
      [
        5,
        new Team(
          5,
          '',
          ImmutableMap([
            [
              5,
              new Bot(
                5,
                'Test Player',
                5,
                500,
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
    type: 'SpawnEffect',
    units: ImmutableMap([
      [vec(2, 1), Bomber.create(2)], // This unit is dropped because there is already a unit in this location.
      [vec(3, 2), Bomber.create(2)],
      [vec(2, 2), FighterJet.create(1)],
      [vec(5, 4), Helicopter.create(5)],
      [vec(1, 3), Bomber.create(4)],
    ]),
  } as const);
  const gameState: GameState = gameStateEntry ? [gameStateEntry] : [];
  const encodedGameActionResponse = encodeGameActionResponse(
    map,
    map,
    vision,
    gameState,
    null,
  );
  const screenshot = await captureGameActionResponse(
    map,
    encodedGameActionResponse,
    player1.userId,
  );

  expect(
    snapshotEncodedActionResponse(encodedGameActionResponse),
  ).toMatchInlineSnapshot(
    `"Spawn { units: [2,2 → Fighter Jet { id: 18, health: 100, player: 1, fuel: 50, ammo: [ [ 1, 8 ] ] }, 1,3 → Bomber { id: 19, health: 100, player: 4, fuel: 40, ammo: [ [ 1, 5 ] ] }, 3,2 → Bomber { id: 19, health: 100, player: 2, fuel: 40, ammo: [ [ 1, 5 ] ] }], teams: [ { id: 1, name: '', players: [ { activeSkills: [], ai: undefined, charge: 0, funds: 500, id: 4, misses: 0, name: 'Test Player', skills: [], stats: [ 0, 0, 0, 0, 0, 0, 0, 0 ] } ] }, { id: 5, name: '', players: [ { activeSkills: [], ai: undefined, charge: 0, funds: 500, id: 5, misses: 0, name: 'Test Player', skills: [], stats: [ 0, 0, 0, 0, 0, 0, 0, 0 ] } ] } ] }"`,
  );

  printGameState('Last State', screenshot);
  expect(screenshot).toMatchImageSnapshot();

  const actionResponse = gameStateEntry![0];
  const gameActionResponseScreenshot = (
    await captureGameState(
      [[actionResponse, applyActionResponse(map, vision, actionResponse)]],
      player1.userId,
    )
  ).at(-1)?.[2];
  if (!gameActionResponseScreenshot) {
    throw new Error('Could not generate screenshot.');
  }
  printGameState('Client State', gameActionResponseScreenshot);
  expect(gameActionResponseScreenshot).toMatchImageSnapshot();
});
