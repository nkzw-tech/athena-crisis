import {
  ActionResponse,
  ActivatePowerActionResponse,
  AttackBuildingActionResponse,
  AttackUnitActionResponse,
  EndTurnActionResponse,
  ToggleLightningActionResponse,
} from '../ActionResponse.tsx';

const destructiveActions = new Set([
  'ActivatePower',
  'AttackBuilding',
  'AttackUnit',
  'EndTurn',
  'ToggleLightning',
]);

export default function isDestructiveActionResponse(
  actionResponse: ActionResponse,
): actionResponse is
  | ActivatePowerActionResponse
  | AttackBuildingActionResponse
  | AttackUnitActionResponse
  | EndTurnActionResponse
  | ToggleLightningActionResponse {
  return destructiveActions.has(actionResponse.type);
}
