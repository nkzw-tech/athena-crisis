import { getSkillDefenseStatusEffects } from '../info/Skill.tsx';
import { TileInfo } from '../info/Tile.tsx';
import { LeaderStatusEffect } from '../map/Configuration.tsx';
import Entity, { isUnit } from '../map/Entity.tsx';
import MapData from '../MapData.tsx';

export default function getDefenseStatusEffect(
  map: MapData,
  entity: Entity,
  tile: TileInfo | null,
) {
  const player = map.getPlayer(entity);
  return (
    1 +
    (isUnit(entity) && entity.isLeader() ? LeaderStatusEffect : 0) +
    getSkillDefenseStatusEffects(
      entity,
      tile,
      player.skills,
      player.activeSkills,
    )
  );
}
