import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import { getUnitInfo, UnitInfo } from '../info/Unit.tsx';

export default function formatText(
  text: string,
  unit: UnitInfo,
  name: 'name' | 'characterName',
  extra?: ReadonlyArray<readonly [string, string]>,
) {
  if (extra) {
    for (const [key, value] of extra) {
      text = text.replaceAll(`{${key}}`, value);
    }
  }

  return text
    .replaceAll(/{(?:(\d+)\.)?name}/g, (_, id: string) => {
      const maybeUnitID = id?.length && parseInteger(id);
      return ((maybeUnitID && getUnitInfo(maybeUnitID)) || unit)[name];
    })
    .trim();
}
