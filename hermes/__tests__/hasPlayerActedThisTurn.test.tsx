import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import { House } from '@deities/athena/info/Building.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import encodeTurnState from '../game/encodeTurnState.tsx';
import { PreviousGameState } from '../game/getTurnState.tsx';
import hasPlayerActedThisTurn from '../game/hasPlayerActedThisTurn.tsx';

const map = MapData.createMap({
  buildings: [[1, 1, House.create(1).toJSON()]],
  map: [1, 1],
  size: { height: 1, width: 2 },
  teams: [
    { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
    { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
  ],
});
const effects: Effects = new Map();
const message: ActionResponse = { message: 'Hello!', type: 'Message' };
const automaticResponse: ActionResponse = { from: vec(1, 1), type: 'CompleteBuilding' };
const generatedResponses: ReadonlyArray<ActionResponse> = [
  { charges: 1, player: 1, type: 'IncreaseCharge' },
  { funds: 100, player: 1, type: 'IncreaseFunds' },
  { player: 1, time: 60, type: 'SetPlayerTime' },
];
const gameplayAction: ActionResponse = { from: vec(1, 1), type: 'CompleteUnit' };

const createTurnState = (
  recentActions: PreviousGameState<MapData>[3],
): PreviousGameState<MapData> => [map, null, effects, recentActions];

test('a player has not acted when the turn has no actions', () => {
  expect(hasPlayerActedThisTurn(createTurnState([]))).toBe(false);
});

test('messages and their automatic responses do not count as acting', () => {
  const turnState = createTurnState([[[message, automaticResponse], effects]]);

  expect(hasPlayerActedThisTurn(turnState)).toBe(false);
  expect(hasPlayerActedThisTurn(encodeTurnState(turnState))).toBe(false);
});

test('game-generated responses do not count as acting', () => {
  const turnState = createTurnState(
    generatedResponses.map((actionResponse) => [[actionResponse], effects]),
  );

  expect(hasPlayerActedThisTurn(turnState)).toBe(false);
  expect(hasPlayerActedThisTurn(encodeTurnState(turnState))).toBe(false);
});

test('a gameplay action counts as acting in decoded and encoded turn state', () => {
  const turnState = createTurnState([
    [[message], effects],
    [[gameplayAction], effects],
  ]);

  expect(hasPlayerActedThisTurn(turnState)).toBe(true);
  expect(hasPlayerActedThisTurn(encodeTurnState(turnState))).toBe(true);
});
