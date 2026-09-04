import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { ActionResponse } from '../ActionResponse.tsx';

export default function isPlayerAction(actionResponse: ActionResponse): boolean {
  const { type } = actionResponse;
  switch (type) {
    // Player actions.
    case 'ActivateCrystal':
    case 'ActivatePower':
    case 'AttackBuilding':
    case 'AttackUnit':
    case 'BuySkill':
    case 'Capture':
    case 'CompleteBuilding':
    case 'CompleteUnit':
    case 'CreateBuilding':
    case 'CreateTracks':
    case 'CreateUnit':
    case 'DropUnit':
    case 'Fold':
    case 'Heal':
    case 'Move':
    case 'Rescue':
    case 'Sabotage':
    case 'Supply':
    case 'ToggleLightning':
    case 'Unfold':
      return true;
    // Game-generated actions.
    case 'AbandonInvasion':
    case 'AttackBuildingGameOver':
    case 'AttackUnitGameOver':
    case 'BeginGame':
    case 'BeginTurnGameOver':
    case 'CaptureGameOver':
    case 'CharacterMessage':
    case 'EndTurn':
    case 'GameEnd':
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
    case 'MoveUnit':
    case 'OptionalObjective':
    case 'PreviousTurnGameOver':
    case 'ReceiveReward':
    case 'SecretDiscovered':
    case 'SetPlayer':
    case 'SetPlayerTime':
    case 'SetViewer':
    case 'Spawn':
    case 'Start':
    case 'Swap':
      return false;
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('isPlayerAction', type);
    }
  }
}
