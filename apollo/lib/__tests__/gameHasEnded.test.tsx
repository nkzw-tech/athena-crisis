import { expect, test } from 'vitest';
import gameHasEnded from '../gameHasEnded.tsx';

const gameEnd = { type: 'GameEnd' } as const;
const setPlayerTime = { player: 1, time: 30, type: 'SetPlayerTime' } as const;

test('detects GameEnd in a server game state', () => {
  expect(gameHasEnded([[gameEnd, null]])).toBe(true);
});

test('detects GameEnd in client action responses', () => {
  expect(gameHasEnded([{ actionResponse: gameEnd }, { actionResponse: setPlayerTime }])).toBe(true);
});

test('returns false when the game has not ended', () => {
  expect(gameHasEnded([{ actionResponse: setPlayerTime }])).toBe(false);
  expect(gameHasEnded([])).toBe(false);
  expect(gameHasEnded(null)).toBe(false);
  expect(gameHasEnded(undefined)).toBe(false);
});
