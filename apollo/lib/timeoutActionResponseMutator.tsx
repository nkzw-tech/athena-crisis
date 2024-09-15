import { ActionResponse } from '../ActionResponse.tsx';

export default function timeoutActionResponseMutator(
  actionResponse: ActionResponse,
) {
  return actionResponse.type === 'EndTurn'
    ? { ...actionResponse, miss: true }
    : actionResponse;
}
