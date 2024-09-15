import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';

export default function crystalToColor(crystal: Crystal, alpha = 1): string {
  switch (crystal) {
    case Crystal.Blue:
      return getColor('blue', alpha);
    case Crystal.Gold:
      return `rgba(${applyVar('color-gold-base')}, ${alpha})`;
    case Crystal.Green:
      return getColor('green', alpha);
    case Crystal.Gray:
      return getColor('team', alpha);
    case Crystal.Purple:
      return getColor('purple', alpha);
    case Crystal.Red:
      return getColor('red', alpha);
    default: {
      crystal satisfies never;
      throw new UnknownTypeError('crystalToColor', crystal);
    }
  }
}
