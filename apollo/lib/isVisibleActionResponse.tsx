import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { ActionResponse } from '../ActionResponse.tsx';

export default function isVisibleActionResponse(actionResponse: ActionResponse) {
  const { type } = actionResponse;
  switch (type) {
    case 'AttackBuilding':
    case 'AttackUnit':
    case 'CreateUnit':
    case 'DropUnit':
    case 'Heal':
    case 'Move':
    case 'Rescue':
    case 'Sabotage':
    case 'BuySkill':
    case 'Capture':
    case 'CreateBuilding':
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
    case 'Spawn':
    case 'HiddenMove':
    case 'ActivatePower':
    case 'EndTurn':
    case 'Swap':
    case 'CompleteBuilding':
    case 'CompleteUnit':
    case 'MoveUnit':
    case 'AbandonInvasion':
    case 'ActivateCrystal':
    case 'BeginGame':
    case 'BeginTurnGameOver':
    case 'CaptureGameOver':
    case 'GameEnd':
    case 'AttackBuildingGameOver':
    case 'AttackUnitGameOver':
    case 'IncreaseCharge':
    case 'IncreaseFunds':
    case 'HiddenFundAdjustment':
    case 'PreviousTurnGameOver':
      return true;
    case 'CharacterMessage':
    case 'OptionalObjective':
    case 'Message':
    case 'ReceiveReward':
    case 'SecretDiscovered':
    case 'SetPlayer':
    case 'SetPlayerTime':
    case 'SetViewer':
    case 'Start':
      return false;
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('getActionResponseVectors', type);
    }
  }
}
