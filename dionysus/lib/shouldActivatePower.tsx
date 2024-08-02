import {
  ActiveUnitTypes,
  getActiveUnitTypes,
  getHealUnitTypes,
  isRecoverySkill,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import Player from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';

const getUnitRatio = (
  map: MapData,
  player: Player,
  activeType: ActiveUnitTypes,
) => {
  const allUnits = map.units.filter(
    (unit, vector) =>
      map.matchesPlayer(unit, player) &&
      matchesActiveType(activeType, unit, vector),
  );
  const completedUnits = allUnits.filter((unit) => unit.isCompleted());
  return completedUnits.size / allUnits.size;
};

const shouldConsiderUnitRatio = (skill: Skill) => {
  switch (skill) {
    case Skill.BuyUnitAlien:
    case Skill.BuyUnitBazookaBear:
    case Skill.BuyUnitOctopus:
    case Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor:
      return false;

    case Skill.ArtilleryRangeIncrease:
    case Skill.AttackAndDefenseDecreaseEasy:
    case Skill.AttackAndDefenseIncreaseHard:
    case Skill.AttackIncreaseMajorDefenseDecreaseMajor:
    case Skill.AttackIncreaseMinor:
    case Skill.BuyUnitAcidBomber:
    case Skill.BuyUnitAIU:
    case Skill.BuyUnitBrute:
    case Skill.BuyUnitCannon:
    case Skill.BuyUnitCommander:
    case Skill.BuyUnitDinosaur:
    case Skill.BuyUnitSuperAPU:
    case Skill.BuyUnitSuperTank:
    case Skill.BuyUnitZombieDefenseDecreaseMajor:
    case Skill.CounterAttackPower:
    case Skill.DefenseIncreaseMinor:
    case Skill.HealInfantryMedicPower:
    case Skill.HealVehiclesAttackDecrease:
    case Skill.MovementIncreaseGroundUnitDefenseDecrease:
    case Skill.NoUnitRestrictions:
    case Skill.RecoverAirUnits:
    case Skill.UnitAbilitySniperImmediateAction:
    case Skill.UnitBattleShipMoveAndAct:
    case Skill.UnitInfantryForestDefenseIncrease:
    case Skill.UnitRailDefenseIncreasePowerAttackIncrease:
      return true;
    default: {
      skill satisfies never;
      throw new UnknownTypeError('shouldConsiderUnitRatio', String(skill));
    }
  }
};

export default function shouldActivatePower(map: MapData, skill: Skill) {
  if (!shouldConsiderUnitRatio(skill) || getHealUnitTypes(skill)) {
    return true;
  }

  const player = map.getCurrentPlayer();
  const ratio = getUnitRatio(
    map,
    player,
    getActiveUnitTypes(map, player.copy({ activeSkills: new Set([skill]) })),
  );

  const isRecovery = isRecoverySkill(skill);
  if ((!isRecovery && ratio <= 0.5) || (isRecovery && ratio >= 0.75)) {
    return true;
  }

  return false;
}
