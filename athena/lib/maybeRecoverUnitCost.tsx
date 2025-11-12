import { CostRecoverySkillModifier, Skill } from '../info/Skill.tsx';
import Player from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';

export default function maybeRecoverUnitCost(
  shouldRecover: boolean,
  player: Player,
  unit: Unit | undefined,
) {
  if (shouldRecover && unit && player.activeSkills.has(Skill.CostRecovery)) {
    const cost = unit.info.getCostFor(player);
    if (cost < Number.POSITIVE_INFINITY) {
      return player.modifyFunds(Math.ceil(cost * CostRecoverySkillModifier));
    }
  }

  return player;
}
