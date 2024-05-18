import { Zombie } from '../info/Unit.tsx';
import type Unit from '../map/Unit.tsx';

export default function maybeConvertPlayer(
  unit: Unit,
  attackingUnit: Unit | null | undefined,
  state: 'recover' | 'complete',
) {
  return attackingUnit && attackingUnit.id === Zombie.id
    ? unit.setPlayer(attackingUnit.player)[state]()
    : unit;
}
