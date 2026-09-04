import { ActionResponse } from '../ActionResponse.tsx';
import { GameActionResponses } from '../Types.tsx';

export default function gameHasEnded(
  responses:
    | GameActionResponses
    | ReadonlyArray<readonly [ActionResponse, ...Array<unknown>]>
    | null
    | undefined,
) {
  return !!responses?.some(
    (response) =>
      ('actionResponse' in response ? response.actionResponse : response[0]).type === 'GameEnd',
  );
}
