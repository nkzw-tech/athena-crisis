import MapData from '@deities/athena/MapData.tsx';
import { ActionResponse } from './ActionResponse.tsx';

const Mutators = {
  actAsEveryPlayer: (map: MapData, actionResponse: ActionResponse) =>
    actionResponse.type === 'EndTurn'
      ? { ...actionResponse, rotatePlayers: true }
      : actionResponse,
} as const;

export type MutateActionResponseFnName = keyof typeof Mutators;

export default Mutators;
