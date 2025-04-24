import {
  ActionResponse,
  CreateUnitActionResponse,
  DropUnitActionResponse,
  MoveActionResponse,
  SpawnActionResponse,
} from '../ActionResponse.tsx';

const moveActions = new Set(['CreateUnit', 'DropUnit', 'Move', 'Spawn']);

export default function isMoveActionResponse(
  actionResponse: ActionResponse,
): actionResponse is
  | CreateUnitActionResponse
  | DropUnitActionResponse
  | MoveActionResponse
  | SpawnActionResponse {
  return moveActions.has(actionResponse.type);
}
