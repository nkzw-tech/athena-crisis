import { ActionResponse } from './ActionResponse.tsx';

const Mutators = {
  actAsEveryPlayer: (actionResponse: ActionResponse) =>
    actionResponse.type === 'EndTurn'
      ? { ...actionResponse, rotatePlayers: true }
      : actionResponse,
} as const;

export type MutateActionResponseFnName = keyof typeof Mutators;

export default Mutators;
