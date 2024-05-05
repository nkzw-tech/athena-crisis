import Player from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';

export default function getUnitValue(unit: Unit, player: Player) {
  const cost = unit.info.getCostFor(player);
  return cost < Number.POSITIVE_INFINITY
    ? cost
    : (unit.info.defense + unit.info.configuration.fuel) * 20;
}
