import { PoisonDamage } from '../map/Configuration.tsx';
import Unit, { UnitStatusEffect } from '../map/Unit.tsx';
import MapData, { PlayerOrPlayerID } from '../MapData.tsx';

export function isPoisoned(map: MapData, player: PlayerOrPlayerID, unit: Unit) {
  return (
    unit.statusEffect === UnitStatusEffect.Poison &&
    map.matchesPlayer(player, unit)
  );
}

export default function applyBeginTurnStatusEffects(
  map: MapData,
  player: PlayerOrPlayerID,
) {
  return map.copy({
    units: map.units.map((unit) =>
      isPoisoned(map, player, unit) ? unit.modifyHealth(-PoisonDamage) : unit,
    ),
  });
}
