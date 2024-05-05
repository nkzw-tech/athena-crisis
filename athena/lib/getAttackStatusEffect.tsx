import { getSkillAttackStatusEffects } from '../info/Skill.tsx';
import { TileInfo } from '../info/Tile.tsx';
import { LeaderStatusEffect } from '../map/Configuration.tsx';
import Unit from '../map/Unit.tsx';
import MapData from '../MapData.tsx';

export default function getAttackStatusEffect(
  map: MapData,
  unit: Unit,
  tile: TileInfo | null,
) {
  let buildingEffect = 0;
  for (const [, building] of map.buildings) {
    if (map.matchesPlayer(building, unit.player)) {
      buildingEffect += building.info.configuration.attackStatusEffect;
    }
  }

  const player = map.getPlayer(unit);
  return (
    1 +
    buildingEffect +
    (unit.isLeader() ? LeaderStatusEffect : 0) +
    getSkillAttackStatusEffects(
      unit.info,
      tile,
      player.skills,
      player.activeSkills,
    )
  );
}
