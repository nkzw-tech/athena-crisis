import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbtee';

export default function getTranslatedCrystalName(crystal: Crystal) {
  switch (crystal) {
    case Crystal.Power:
      return String(fbt('Power Crystal', 'Crystal name'));
    case Crystal.Help:
      return String(fbt('Valor Crystal', 'Crystal name'));
    case Crystal.Phantom:
      return String(fbt('Phantom Crystal', 'Crystal name'));
    case Crystal.Command:
      return String(fbt('Command Crystal', 'Crystal name'));
    case Crystal.Super:
      return String(fbt('Super Crystal', 'Crystal name'));
    case Crystal.Memory:
      return String(fbt('Memory Crystal', 'Crystal name'));
    default: {
      crystal satisfies never;
      throw new UnknownTypeError('getTranslatedCrystalName', crystal);
    }
  }
}
