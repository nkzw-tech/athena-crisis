import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbt';

export default function getTranslatedCrystalName(crystal: Crystal) {
  switch (crystal) {
    case Crystal.Green:
      return String(fbt('Power Crystal', 'Crystal name'));
    case Crystal.Blue:
      return String(fbt('Valor Crystal', 'Crystal name'));
    case Crystal.Red:
      return String(fbt('Phantom Crystal', 'Crystal name'));
    case Crystal.Purple:
      return String(fbt('Command Crystal', 'Crystal name'));
    case Crystal.Gold:
      return String(fbt('Super Crystal', 'Crystal name'));
    case Crystal.Gray:
      return String(fbt('Memory Crystal', 'Crystal name'));
    default: {
      crystal satisfies never;
      throw new UnknownTypeError('getTranslatedCrystalName', crystal);
    }
  }
}
