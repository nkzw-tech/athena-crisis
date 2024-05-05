import { expect, test } from 'vitest';
import { resolveDynamicPlayerID } from '../map/Player.tsx';
import MapData from '../MapData.tsx';

test('`resolveDynamicPlayerID` resolves to the correct players', () => {
  const map = MapData.createMap({
    map: Array(3 * 3).fill(1),
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 0, id: 2, name: 'AI' }],
      },
    ],
  });

  expect(resolveDynamicPlayerID(map, 'self')).toBe(1);
  expect(resolveDynamicPlayerID(map, 'team')).toBe(1);
  expect(resolveDynamicPlayerID(map, 'opponent')).toBe(2);
});

test('`resolveDynamicPlayerID` always prefers human players', () => {
  const map = MapData.createMap({
    currentPlayer: 2,
    map: Array(3 * 3).fill(1),
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          { funds: 0, id: 1, name: 'AI-1' },
          { funds: 0, id: 3, userId: '1' },
        ],
      },
      {
        id: 2,
        name: '',
        players: [
          { funds: 0, id: 2, name: 'AI-2' },
          { funds: 0, id: 4, name: 'AI-3' },
          { funds: 0, id: 5, userId: '3' },
        ],
      },
    ],
  });

  expect(resolveDynamicPlayerID(map, 'self')).toBe(2);
  expect(resolveDynamicPlayerID(map, 'team')).toBe(5);
  expect(resolveDynamicPlayerID(map, 'opponent')).toBe(3);
});
