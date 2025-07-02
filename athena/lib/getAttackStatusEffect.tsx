import { getSkillAttackStatusEffects, Skill } from '../info/Skill.tsx';
import { TileInfo } from '../info/Tile.tsx';
import { Ability } from '../info/Unit.tsx';
import { Crystal, CrystalAttackEffect } from '../invasions/Crystal.tsx';
import {
  LeaderStatusEffect,
  MoraleStatusEffect,
} from '../map/Configuration.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function getAttackStatusEffect(
  map: MapData,
  unit: Unit,
  vector: Vector | null,
  tile: TileInfo | null,
): [attackStatusEffect: number, flatDamageStatusEffect: number] {
  let buildingEffect = 0;
  let flatDamageEffect = 0;
  const player = map.getPlayer(unit);
  for (const [, building] of map.buildings) {
    if (map.matchesPlayer(building, player)) {
      buildingEffect += building.info.configuration.attackStatusEffect;
      if (player.skills.has(Skill.UnlockScientist)) {
        flatDamageEffect += building.info.configuration.flatDamageStatusEffect;
      }
    }
  }

  let unitEffect = 0;
  if (vector) {
    for (const adjacent of vector.adjacent()) {
      const unit = map.units.get(adjacent);
      if (
        unit?.info.hasAbility(Ability.Morale) &&
        map.matchesPlayer(unit, player)
      ) {
        unitEffect += MoraleStatusEffect;
      }
    }
  }

  const crystalEffect =
    player.isHumanPlayer() && player.crystal === Crystal.Power
      ? CrystalAttackEffect
      : 0;

  return [
    Math.max(
      0,
      1 +
        crystalEffect +
        buildingEffect +
        unitEffect +
        (unit.isLeader() ? LeaderStatusEffect : 0) +
        getSkillAttackStatusEffects(unit, tile, player),
    ),
    flatDamageEffect,
  ];
}
