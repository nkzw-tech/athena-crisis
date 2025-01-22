import { decodeEffects } from '@deities/apollo/Effects.tsx';
import { decodeActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { PreviousGameState } from './getTurnState.tsx';

export default function decodeTurnState(
  encodedTurnState: PreviousGameState<PlainMap> | null,
): PreviousGameState<MapData> | null {
  return encodedTurnState
    ? [
        MapData.fromObject(encodedTurnState[0]),
        encodedTurnState[1] ? decodeActionResponse(encodedTurnState[1]) : null,
        decodeEffects(encodedTurnState[2]),
        encodedTurnState[3]?.length
          ? encodedTurnState[3].map(([actionResponses, effects]) => [
              actionResponses.map(decodeActionResponse),
              decodeEffects(effects),
            ])
          : [],
      ]
    : null;
}
