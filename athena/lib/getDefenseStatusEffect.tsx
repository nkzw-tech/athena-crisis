import { getSkillDefenseStatusEffects } from '../info/Skill.tsx';
import type { TileInfo } from '../info/Tile.tsx';
import { LeaderStatusEffect } from '../map/Configuration.tsx';
import type Entity from '../map/Entity.tsx';
import { isUnit } from '../map/Entity.tsx';
import type MapData from '../MapData.tsx';

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
      entity.info,
      tile,
      player.skills,
      player.activeSkills,
    )
  );
}
