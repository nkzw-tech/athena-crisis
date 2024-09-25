import { Skill } from '@deities/athena/info/Skill.tsx';
import {
  AcidBomber,
  AIU,
  Alien,
  Battleship,
  BazookaBear,
  Brute,
  Cannon,
  Commander,
  Dinosaur,
  InfernoJetpack,
  Octopus,
  Saboteur,
  Sniper,
  SuperAPU,
  SuperTank,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';

export default function getSkillBasedPortrait(skill: Skill) {
  switch (skill) {
    case Skill.BuyUnitAlien:
      return Alien;
    case Skill.BuyUnitBazookaBear:
      return BazookaBear;
    case Skill.BuyUnitOctopus:
      return Octopus;
    case Skill.BuyUnitAcidBomber:
      return AcidBomber;
    case Skill.BuyUnitDinosaur:
      return Dinosaur;
    case Skill.BuyUnitAIU:
      return AIU;
    case Skill.BuyUnitBrute:
      return Brute;
    case Skill.BuyUnitCannon:
      return Cannon;
    case Skill.BuyUnitCommander:
      return Commander;
    case Skill.BuyUnitSuperTank:
      return SuperTank;
    case Skill.BuyUnitSuperAPU:
      return SuperAPU;
    case Skill.BuyUnitZombieDefenseDecreaseMajor:
      return Zombie;
    case Skill.Sabotage:
      return Saboteur;
    case Skill.SpawnUnitInfernoJetpack:
      return InfernoJetpack;
    case Skill.UnitAbilitySniperImmediateAction:
      return Sniper;
    case Skill.UnitBattleShipMoveAndAct:
      return Battleship;

    case Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor:
    case Skill.ArtilleryRangeIncrease:
    case Skill.AttackAndDefenseDecreaseEasy:
    case Skill.AttackAndDefenseIncreaseHard:
    case Skill.AttackIncreaseMajorDefenseDecreaseMajor:
    case Skill.AttackIncreaseMinor:
    case Skill.CounterAttackPower:
    case Skill.DefenseIncreaseMinor:
    case Skill.HealInfantryMedicPower:
    case Skill.HealVehiclesAttackDecrease:
    case Skill.MovementIncreaseGroundUnitDefenseDecrease:
    case Skill.NoUnitRestrictions:
    case Skill.RecoverAirUnits:
    case Skill.UnitInfantryForestAttackAndDefenseIncrease:
    case Skill.UnitRailDefenseIncreasePowerAttackIncrease:
      return null;
    default: {
      skill satisfies never;
      throw new UnknownTypeError('shouldConsiderUnitRatio', String(skill));
    }
  }
}
