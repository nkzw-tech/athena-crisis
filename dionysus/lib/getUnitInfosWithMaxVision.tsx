import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import sortBy from '@nkzw/core/sortBy.js';

export default function getUnitInfosWithMaxVision(
  unitInfosWithWeight: ReadonlyArray<UnitInfo>,
) {
  const unitInfos = sortBy(
    [...unitInfosWithWeight],
    ({ configuration: { vision } }) => -vision,
  );
  const maxVision = unitInfos[0].configuration.vision;
  for (let i = 1; i < unitInfos.length; i++) {
    const unit = unitInfos[i];
    if (unit.configuration.vision < maxVision) {
      return unitInfos.slice(0, i);
    }
  }
  return unitInfos;
}
