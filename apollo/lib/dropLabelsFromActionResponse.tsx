import { PlayerIDSet } from '@deities/athena/map/Player.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

export default function dropLabelsFromActionResponse(
  actionResponse: ActionResponse,
  labels: PlayerIDSet | null,
): ActionResponse {
  if (!labels?.size) {
    return actionResponse;
  }

  const { type } = actionResponse;
  switch (type) {
    case 'CreateUnit': {
      const { unit } = actionResponse;
      return unit.label != null && labels.has(unit.label)
        ? { ...actionResponse, unit: unit.dropLabel(labels) }
        : actionResponse;
    }
    case 'Spawn':
      return {
        ...actionResponse,
        units: actionResponse.units.map((unit) => unit.dropLabel(labels)),
      };
    case 'AttackBuilding':
    case 'Capture':
    case 'CreateBuilding': {
      const { building } = actionResponse;
      return building?.label != null && labels.has(building.label)
        ? { ...actionResponse, building: building.dropLabel(labels) }
        : actionResponse;
    }
    case 'AttackUnit':
    case 'DropUnit':
    case 'Heal':
    case 'Move':
    case 'Rescue':
    case 'Sabotage':
    case 'BuySkill':
    case 'CreateTracks':
    case 'Fold':
    case 'HiddenTargetAttackBuilding':
    case 'HiddenTargetAttackUnit':
    case 'Supply':
    case 'Unfold':
    case 'HiddenDestroyedBuilding':
    case 'HiddenSourceAttackBuilding':
    case 'HiddenSourceAttackUnit':
    case 'ToggleLightning':
    case 'HiddenMove':
    case 'ActivatePower':
    case 'EndTurn':
    case 'CharacterMessage':
    case 'CompleteBuilding':
    case 'CompleteUnit':
    case 'MoveUnit':
    case 'AttackUnitGameOver':
    case 'BeginGame':
    case 'BeginTurnGameOver':
    case 'CaptureGameOver':
    case 'GameEnd':
    case 'HiddenFundAdjustment':
    case 'Message':
    case 'OptionalObjective':
    case 'PreviousTurnGameOver':
    case 'ReceiveReward':
    case 'SecretDiscovered':
    case 'SetViewer':
    case 'Start':
      return actionResponse;
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('getActionResponseVectors', type);
    }
  }
}
