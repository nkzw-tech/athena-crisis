import { encodeEffects } from '@deities/apollo/Effects.tsx';
import { encodeActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { PreviousGameState } from './getTurnState.tsx';

export default function encodeTurnState(
  turnState: PreviousGameState<MapData> | null,
): PreviousGameState<PlainMap> | null {
  return turnState
    ? [
        turnState[0].toJSON(),
        turnState[1] ? encodeActionResponse(turnState[1]) : null,
        encodeEffects(turnState[2]),
        turnState[3]?.length
          ? turnState[3].map(([actionResponses, effects]) => [
              actionResponses.map(encodeActionResponse),
              encodeEffects(effects),
            ])
          : null,
      ]
    : null;
}
