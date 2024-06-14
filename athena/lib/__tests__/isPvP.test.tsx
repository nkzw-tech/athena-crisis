import { expect, test } from 'vitest';
import { PlainPlayer } from '../../map/Player.tsx';
import MapData from '../../MapData.tsx';
import isPvP from '../isPvP.tsx';

const teamWithPlayers = (players: ReadonlyArray<PlainPlayer>) =>
  players.map(
    (player) =>
      ({
        id: player.id,
        name: '',
        players: [player],
      }) as const,
  );

test('`isPvP` only considers games with active human players as pvp', () => {
  expect(
    isPvP(
      MapData.createMap({
        active: [1, 2],
        teams: teamWithPlayers([
          { funds: 0, id: 1, name: 'AI' },
          { funds: 0, id: 2, name: 'AI' },
        ]),
      }),
    ),
  ).toBe(false);

  expect(
    isPvP(
      MapData.createMap({
        active: [1, 2],
        teams: teamWithPlayers([
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 2, name: 'AI' },
        ]),
      }),
    ),
  ).toBe(false);

  expect(
    isPvP(
      MapData.createMap({
        active: [1, 2],
        teams: teamWithPlayers([
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 2, userId: '2' },
        ]),
      }),
    ),
  ).toBe(true);

  expect(
    isPvP(
      MapData.createMap({
        active: [1, 2, 3],
        teams: teamWithPlayers([
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 2, userId: '2' },
          { funds: 0, id: 3, name: 'AI' },
        ]),
      }),
    ),
  ).toBe(true);

  expect(
    isPvP(
      MapData.createMap({
        active: [1, 2, 3],
        teams: teamWithPlayers([
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 2, userId: '2' },
          { funds: 0, id: 3, userId: '3' },
        ]),
      }),
    ),
  ).toBe(true);

  expect(
    isPvP(
      MapData.createMap({
        active: [1, 2],
        teams: teamWithPlayers([
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 2, userId: '2' },
          { funds: 0, id: 3, name: 'AI' },
        ]),
      }),
    ),
  ).toBe(true);

  expect(
    isPvP(
      MapData.createMap({
        active: [1, 3],
        teams: teamWithPlayers([
          { funds: 0, id: 1, userId: '1' },
          { funds: 0, id: 2, userId: '2' },
          { funds: 0, id: 3, name: 'AI' },
        ]),
      }),
    ),
  ).toBe(false);
});
