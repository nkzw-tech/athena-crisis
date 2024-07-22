import { getHealUnitTypes, Skill } from '@deities/athena/info/Skill.tsx';
import getAirUnitsToRecover from '@deities/athena/lib/getAirUnitsToRecover.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import { HealAmount } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function applyPower(skill: Skill, map: MapData) {
  const healTypes = getHealUnitTypes(skill);
  const player = map.getCurrentPlayer();

  if (healTypes) {
    map = map.copy({
      units: map.units.map((unit) =>
        map.matchesPlayer(player, unit) &&
        matchesActiveType(healTypes, unit, null)
          ? unit.modifyHealth(HealAmount)
          : unit,
      ),
    });
  }

  if (skill === Skill.RecoverAirUnits) {
    map = map.copy({
      units: map.units.merge(
        getAirUnitsToRecover(map, player).map((unit) => unit.recover()),
      ),
    });
  }

  return map;
}
