import { getHealUnitTypes, Skill } from '@deities/athena/info/Skill.tsx';
import getAirUnitsToRecover from '@deities/athena/lib/getAirUnitsToRecover.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import {
  HealAmount,
  OctopusPowerDamage,
} from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';

export function onPowerUnitUpgrade(
  skill: Skill,
  map: MapData,
  vector: Vector,
  unit: Unit,
) {
  if (skill === Skill.RecoverAirUnits) {
    return map.copy({
      units: map.units.set(vector, unit.recover()),
    });
  }

  return null;
}

export function onPowerUnitOpponentEffect(
  skill: Skill,
  map: MapData,
  vector: Vector,
  unit: Unit,
) {
  if (skill === Skill.BuyUnitOctopus) {
    const newUnit = unit.modifyHealth(-OctopusPowerDamage);
    const isDead = newUnit.isDead();
    return map.copy({
      teams: updatePlayers(map.teams, [
        map.getCurrentPlayer().modifyStatistics({
          damage: OctopusPowerDamage,
          destroyedUnits: isDead ? 1 : 0,
        }),
        map.getPlayer(unit).modifyStatistics({
          lostUnits: isDead ? 1 : 0,
        }),
      ]),
      units: isDead ? map.units.delete(vector) : map.units.set(vector, newUnit),
    });
  }

  return null;
}

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

  if (skill === Skill.BuyUnitOctopus) {
    for (const [vector, unit] of map.units) {
      if (map.isNonNeutralOpponent(player, unit)) {
        const newUnit = unit.modifyHealth(-OctopusPowerDamage);
        const isDead = newUnit.isDead();
        map = map.copy({
          teams: updatePlayers(map.teams, [
            map.getPlayer(player.id).modifyStatistics({
              damage: OctopusPowerDamage,
              destroyedUnits: isDead ? 1 : 0,
            }),
            map.getPlayer(unit).modifyStatistics({
              lostUnits: isDead ? 1 : 0,
            }),
          ]),
          units: isDead
            ? map.units.delete(vector)
            : map.units.set(vector, newUnit),
        });
      }
    }
  }

  return map;
}
