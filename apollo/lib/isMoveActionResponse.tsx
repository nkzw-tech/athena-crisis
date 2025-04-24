import {
  ActionResponse,
  CreateUnitActionResponse,
  DropUnitActionResponse,
  MoveActionResponse,
  SpawnActionResponse,
  SwapActionResponse,
} from '../ActionResponse.tsx';

const moveActions = new Set([
  'CreateUnit',
  'DropUnit',
  'Move',
  'Spawn',
  'Swap',
]);

export default function isMoveActionResponse(
  actionResponse: ActionResponse,
): actionResponse is
  | CreateUnitActionResponse
  | DropUnitActionResponse
  | MoveActionResponse
  | SpawnActionResponse
  | SwapActionResponse {
  return moveActions.has(actionResponse.type);
}
