import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { decodeActionResponse, EncodedActionResponse } from '@deities/apollo/EncodedActions.tsx';
import isPlayerAction from '@deities/apollo/lib/isPlayerAction.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { PreviousGameState } from './getTurnState.tsx';

type TurnState = PreviousGameState<MapData> | PreviousGameState<PlainMap>;

const decode = (actionResponse: ActionResponse | EncodedActionResponse): ActionResponse =>
  Array.isArray(actionResponse)
    ? decodeActionResponse(actionResponse as EncodedActionResponse)
    : (actionResponse as ActionResponse);

export default function hasPlayerActedThisTurn(turnState: TurnState | null | undefined): boolean {
  return !!turnState?.[3]?.some(([actionResponses]) => {
    const actionResponse = actionResponses[0];
    return actionResponse ? isPlayerAction(decode(actionResponse)) : false;
  });
}
