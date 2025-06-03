import { PlayerIDSet } from '@deities/athena/map/Player.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
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
    case 'Swap': {
      const { sourceUnit, targetUnit } = actionResponse;
      if (targetUnit?.label != null && labels.has(targetUnit.label)) {
        actionResponse = {
          ...actionResponse,
          targetUnit: targetUnit.dropLabel(labels),
        };
      }
      if (sourceUnit.label != null && labels.has(sourceUnit.label)) {
        actionResponse = {
          ...actionResponse,
          sourceUnit: sourceUnit.dropLabel(labels),
        };
      }

      return actionResponse;
    }
    case 'AttackBuilding':
    case 'Capture':
    case 'CreateBuilding': {
      const { building } = actionResponse;
      return building?.label != null && labels.has(building.label)
        ? { ...actionResponse, building: building.dropLabel(labels) }
        : actionResponse;
    }
    case 'AbandonInvasion':
    case 'ActivateCrystal':
    case 'ActivatePower':
    case 'AttackUnit':
    case 'AttackBuildingGameOver':
    case 'AttackUnitGameOver':
    case 'BeginGame':
    case 'BeginTurnGameOver':
    case 'BuySkill':
    case 'CaptureGameOver':
    case 'CharacterMessage':
    case 'CompleteBuilding':
    case 'CompleteUnit':
    case 'CreateTracks':
    case 'DropUnit':
    case 'EndTurn':
    case 'Fold':
    case 'GameEnd':
    case 'Heal':
    case 'HiddenDestroyedBuilding':
    case 'HiddenFundAdjustment':
    case 'HiddenMove':
    case 'HiddenSourceAttackBuilding':
    case 'HiddenSourceAttackUnit':
    case 'HiddenTargetAttackBuilding':
    case 'HiddenTargetAttackUnit':
    case 'IncreaseCharge':
    case 'IncreaseFunds':
    case 'Message':
    case 'Move':
    case 'MoveUnit':
    case 'OptionalObjective':
    case 'PreviousTurnGameOver':
    case 'ReceiveReward':
    case 'Rescue':
    case 'Sabotage':
    case 'SecretDiscovered':
    case 'SetPlayer':
    case 'SetPlayerTime':
    case 'SetViewer':
    case 'Start':
    case 'Supply':
    case 'ToggleLightning':
    case 'Unfold':
      return actionResponse;
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('getActionResponseVectors', type);
    }
  }
}
