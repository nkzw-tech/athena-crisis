import { ActionResponse } from '../ActionResponse.tsx';

export default function (actionResponse: ActionResponse) {
  return actionResponse.type === 'EndTurn'
    ? { ...actionResponse, miss: true }
    : actionResponse;
}
