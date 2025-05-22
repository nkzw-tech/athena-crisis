import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import { ActionResponses } from '../ActionResponse.tsx';
import { MutableGameState } from '../Types.tsx';
import applyActionResponse from './applyActionResponse.tsx';

export default function applyActionResponses(
  map: MapData,
  actionResponses: ActionResponses,
): MutableGameState {
  const gameState = [];
  for (const actionResponse of actionResponses) {
    map = applyActionResponse(
      map,
      new Vision(map.currentPlayer),
      actionResponse,
    );
    gameState.push([actionResponse, map] as const);
  }
  return gameState;
}
