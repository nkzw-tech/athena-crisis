import MapData from '@deities/athena/MapData.tsx';
import {
  decodeActionResponse,
  encodeActionResponse,
} from './EncodedActions.tsx';
import { EncodedGameState, GameState } from './Types.tsx';

export function encodeGameState(gameState: GameState): EncodedGameState {
  return [...gameState].map(([actionResponse, map]) => [
    encodeActionResponse(actionResponse),
    map.toJSON(),
  ]);
}

export function decodeGameState(encodedGameState: EncodedGameState): GameState {
  return encodedGameState.map(([encodedActionResponse, plainMap]) => [
    decodeActionResponse(encodedActionResponse),
    MapData.fromObject(plainMap),
  ]);
}
