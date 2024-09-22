import { getSkillAttackStatusEffects } from '../info/Skill.tsx';
import { TileInfo } from '../info/Tile.tsx';
import { Ability } from '../info/Unit.tsx';
import { Crystal, CrystalAttackEffect } from '../invasions/Crystal.tsx';
import { LeaderStatusEffect } from '../map/Configuration.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function getAttackStatusEffect(
  map: MapData,
  unit: Unit,
  vector: Vector | null,
  tile: TileInfo | null,
) {
  let buildingEffect = 0;
  for (const [, building] of map.buildings) {
    if (map.matchesPlayer(building, unit.player)) {
      buildingEffect += building.info.configuration.attackStatusEffect;
    }
  }

  const player = map.getPlayer(unit);
  let unitEffect = 0;
  if (vector) {
    for (const adjacent of vector.adjacent()) {
      const unit = map.units.get(adjacent);
      if (
        unit &&
        unit.info.hasAbility(Ability.Morale) &&
        map.matchesPlayer(unit, player)
      ) {
        unitEffect += 0.1;
      }
    }
  }

  const crystalEffect =
    player.isHumanPlayer() && player.crystal === Crystal.Power
      ? CrystalAttackEffect
      : 0;

  return (
    1 +
    crystalEffect +
    buildingEffect +
    unitEffect +
    (unit.isLeader() ? LeaderStatusEffect : 0) +
    getSkillAttackStatusEffects(unit, tile, player.skills, player.activeSkills)
  );
}
