import { Skill } from '../info/Skill.tsx';
import { Zombie } from '../info/Unit.tsx';
import Player from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';

export default function getUnitValue(unit: Unit, player: Player) {
  if (player.skills.has(Skill.DragonSaboteur)) {
    player = player.copy({
      skills: new Set([...player.skills, Skill.BuyUnitDragon]),
    });
  }
  if (unit.info === Zombie && player.skills.has(Skill.UnlockZombie)) {
    player = player.copy({
      skills: new Set([
        ...player.skills,
        Skill.BuyUnitZombieDefenseDecreaseMajor,
      ]),
    });
  }

  const cost = unit.info.getCostFor(player);
  return cost < Number.POSITIVE_INFINITY
    ? cost
    : (unit.info.defense + unit.info.configuration.fuel) * 20;
}
