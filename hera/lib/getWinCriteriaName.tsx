import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbt';

export default function getWinCriteriaName(criteria: WinCriteria) {
  switch (criteria) {
    case WinCriteria.Default:
      return fbt(
        'Defeat all units or capture HQ',
        'Panel button name for default win condition with HQ.',
      );
    case WinCriteria.CaptureLabel:
      return fbt(
        'Capture buildings by label',
        'Panel button name for capturing by label.',
      );
    case WinCriteria.CaptureAmount:
      return fbt(
        'Capture buildings by amount',
        'Panel button name for capture.',
      );
    case WinCriteria.DefeatLabel:
      return fbt(
        'Defeat units by label',
        'Panel button name for defeat by label.',
      );
    case WinCriteria.EscortLabel:
      return fbt(
        'Escort units by label',
        'Panel button name for escorting any.',
      );
    case WinCriteria.Survival:
      return fbt('Survival', 'Panel button name for survival.');
    case WinCriteria.EscortAmount:
      return fbt('Escort units by amount', 'Panel button name for escort.');
    case WinCriteria.RescueAmount:
      return fbt(
        'Rescue units by amount',
        'Panel button name for rescuing by amount.',
      );
    case WinCriteria.RescueLabel:
      return fbt(
        'Rescue units by label',
        'Panel button name for rescuing by label.',
      );
    case WinCriteria.DefeatAmount:
      return fbt(
        'Defeat units by amount',
        'Panel button name for defeat by amount.',
      );
    case WinCriteria.DefeatOneLabel:
      return fbt(
        'Defeat one unit by label',
        'Panel button name for defeat one by label.',
      );
    case WinCriteria.DestroyLabel:
      return fbt(
        'Destroy buildings by label',
        'Panel button name for destroy by label.',
      );
    case WinCriteria.DestroyAmount:
      return fbt(
        'Destroy buildings by amount',
        'Panel button name for destroy by amount.',
      );
    default: {
      criteria satisfies never;
      throw new UnknownTypeError('getWinCriteriaName', criteria);
    }
  }
}
