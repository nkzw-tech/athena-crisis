import ImmutableMap from '@nkzw/immutable-map';
import { Skill, VampireSkillHeal, VampireSoldierMovementTypes } from '../info/Skill.tsx';
import { HealAmount } from '../map/Configuration.tsx';
import Player from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export type HealEntry = [unit: Unit, amount: number];

export default function getUnitsToHeal(
  map: MapData,
  player: Player,
): ImmutableMap<Vector, HealEntry> {
  const hasVampireSkill = player.skills.has(Skill.VampireHeal);
  let units = ImmutableMap<Vector, HealEntry>();

  for (const [vector, unit] of map.units) {
    if (!map.matchesPlayer(unit, player)) {
      continue;
    }

    const building = map.buildings.get(vector);
    let amount = 0;
    if (building && map.matchesPlayer(building, unit) && building.info.canHeal(unit.info)) {
      amount += HealAmount;
    }
    if (hasVampireSkill && VampireSoldierMovementTypes.has(unit.info.movementType)) {
      amount += VampireSkillHeal;
    }

    if (amount > 0) {
      units = units.set(vector, [unit, amount]);
    }
  }

  return units;
}
