import type { PossibleAttack } from './getPossibleAttacks.tsx';

export default function sortPossibleAttacks(
  itemA: PossibleAttack,
  itemB: PossibleAttack,
): number {
  const aIsLongRange = itemA.unitA.info.isLongRange();
  const bIsLongRange = itemB.unitA.info.isLongRange();
  if (aIsLongRange && !bIsLongRange) {
    return 1;
  } else if (!aIsLongRange && bIsLongRange) {
    return -1;
  }

  return itemA.getWeight() - itemB.getWeight();
}
