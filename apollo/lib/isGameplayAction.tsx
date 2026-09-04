import { Action } from '../Action.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

export default function isGameplayAction(action: Action | ActionResponse): boolean {
  return action.type !== 'EndTurn' && action.type !== 'Message' && action.type !== 'Start';
}
