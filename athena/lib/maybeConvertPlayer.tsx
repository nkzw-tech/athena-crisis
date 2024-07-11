import { Ability } from '../info/Unit.tsx';
import Unit from '../map/Unit.tsx';

export default function maybeConvertPlayer(
  unit: Unit,
  attackingUnit: Unit | null | undefined,
  state: 'recover' | 'complete',
) {
  return attackingUnit?.info.hasAbility(Ability.Convert)
    ? unit.setPlayer(attackingUnit.player)[state]()
    : unit;
}
