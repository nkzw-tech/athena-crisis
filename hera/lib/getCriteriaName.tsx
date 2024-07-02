import { Criteria } from '@deities/athena/Objectives.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbt';

export default function getCriteriaName(criteria: Criteria) {
  switch (criteria) {
    case Criteria.Default:
      return fbt(
        'Defeat all units or capture HQ',
        'Panel button name for default win condition with HQ.',
      );
    case Criteria.CaptureLabel:
      return fbt(
        'Capture buildings by label',
        'Panel button name for capturing by label.',
      );
    case Criteria.CaptureAmount:
      return fbt(
        'Capture buildings by amount',
        'Panel button name for capture.',
      );
    case Criteria.DefeatLabel:
      return fbt(
        'Defeat units by label',
        'Panel button name for defeat by label.',
      );
    case Criteria.EscortLabel:
      return fbt(
        'Escort units by label',
        'Panel button name for escorting any.',
      );
    case Criteria.Survival:
      return fbt('Survival', 'Panel button name for survival.');
    case Criteria.EscortAmount:
      return fbt('Escort units by amount', 'Panel button name for escort.');
    case Criteria.RescueAmount:
      return fbt(
        'Rescue units by amount',
        'Panel button name for rescuing by amount.',
      );
    case Criteria.RescueLabel:
      return fbt(
        'Rescue units by label',
        'Panel button name for rescuing by label.',
      );
    case Criteria.DefeatAmount:
      return fbt(
        'Defeat units by amount',
        'Panel button name for defeat by amount.',
      );
    case Criteria.DefeatOneLabel:
      return fbt(
        'Defeat one unit by label',
        'Panel button name for defeat one by label.',
      );
    case Criteria.DestroyLabel:
      return fbt(
        'Destroy buildings by label',
        'Panel button name for destroy by label.',
      );
    case Criteria.DestroyAmount:
      return fbt(
        'Destroy buildings by amount',
        'Panel button name for destroy by amount.',
      );
    default: {
      criteria satisfies never;
      throw new UnknownTypeError('getCriteriaName', criteria);
    }
  }
}
