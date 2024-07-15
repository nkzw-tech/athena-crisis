import { Bar } from '@deities/athena/info/Building.tsx';
import { getHealUnitTypes, Skill } from '@deities/athena/info/Skill.tsx';
import { BazookaBear } from '@deities/athena/info/Unit.tsx';
import assignDeterministicUnitNames from '@deities/athena/lib/assignDeterministicUnitNames.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import getAirUnitsToRecover from '@deities/athena/lib/getAirUnitsToRecover.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import { HealAmount } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';

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

  if (skill === Skill.BuyUnitBazookaBear) {
    let newUnits = ImmutableMap<Vector, Unit>();
    for (const [vector, building] of map.buildings) {
      const unit = map.units.get(vector);
      if (
        building.id === Bar.id &&
        map.matchesPlayer(building, player) &&
        (!unit || map.matchesTeam(unit, building))
      ) {
        const deployVector = vector
          .expand()
          .find((vector) => canDeploy(map, BazookaBear, vector, true));
        if (deployVector) {
          newUnits = newUnits.set(deployVector, BazookaBear.create(player));
        }
      }
    }

    map = map.copy({
      units: map.units.merge(assignDeterministicUnitNames(map, newUnits)),
    });
  }

  return map;
}
