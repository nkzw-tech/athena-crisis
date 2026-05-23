import { Skill } from '@deities/athena/info/Skill.tsx';
import { BaseColor } from '@deities/ui/getColor.tsx';
import { SVGIcon } from '@deities/ui/Icon.tsx';
import AggressiveStance from '@deities/ui/icons/AggressiveStance.tsx';
import Alien from '@deities/ui/icons/Alien.tsx';
import DropHalf from '@deities/ui/icons/BloodMoon.tsx';
import Bubble from '@deities/ui/icons/Bubble.tsx';
import Bullseye from '@deities/ui/icons/Bullseye.tsx';
import BullseyeArrow from '@deities/ui/icons/BullseyeArrow.tsx';
import Charge from '@deities/ui/icons/Charge.tsx';
import Coin from '@deities/ui/icons/Coin.tsx';
import Crosshair from '@deities/ui/icons/Crosshair.tsx';
import Dinosaur from '@deities/ui/icons/Dinosaur.tsx';
import RadioSignal from '@deities/ui/icons/Drone.tsx';
import Fire from '@deities/ui/icons/Fire.tsx';
import Flask from '@deities/ui/icons/Flask.tsx';
import Glasses from '@deities/ui/icons/Glasses.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import SuperTank from '@deities/ui/icons/LabelAltMultiple.tsx';
import Medal from '@deities/ui/icons/Medal.tsx';
import Octopus from '@deities/ui/icons/Octopus.tsx';
import Ogre from '@deities/ui/icons/Ogre.tsx';
import Paw from '@deities/ui/icons/Paw.tsx';
import Poison from '@deities/ui/icons/Poison.tsx';
import Receipt from '@deities/ui/icons/Receipt.tsx';
import SabotageIcon from '@deities/ui/icons/Sabotage.tsx';
import Seafarer from '@deities/ui/icons/Seafarer.tsx';
import Seatbelt from '@deities/ui/icons/Seatbelt.tsx';
import ShieldSolid from '@deities/ui/icons/ShieldSolid.tsx';
import Ship from '@deities/ui/icons/Ship.tsx';
import { SkillIconBorderStyle } from '@deities/ui/icons/SkillBorder.tsx';
import Skull from '@deities/ui/icons/Skull.tsx';
import Tide from '@deities/ui/icons/Tide.tsx';
import Track from '@deities/ui/icons/Track.tsx';
import Trash from '@deities/ui/icons/Trash.tsx';
import Tree from '@deities/ui/icons/Tree.tsx';
import Ungroup from '@deities/ui/icons/Ungroup.tsx';
import ZapOn from '@deities/ui/icons/ZapOn.tsx';
import Zombie from '@deities/ui/icons/Zombie.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { fbt } from 'fbtee';
import Angry from 'pixelarticons/svg/angry.svg';
import Balloon from 'pixelarticons/svg/balloon.svg';
import Gps2 from 'pixelarticons/svg/gps-2.svg';
import Gps from 'pixelarticons/svg/gps.svg';
import Loader from 'pixelarticons/svg/loader.svg';
import Redo from 'pixelarticons/svg/redo.svg';
import Repeat from 'pixelarticons/svg/repeat.svg';
import Robot from 'pixelarticons/svg/robot.svg';
import Scissors from 'pixelarticons/svg/scissors.svg';
import Sword from 'pixelarticons/svg/sword.svg';

type SkillConfig = Readonly<{
  alpha?: number;
  borderStyle?: SkillIconBorderStyle;
  colors: BaseColor | ReadonlyArray<BaseColor>;
  icon: SVGIcon;
  name: string;
  textColor?: string;
}>;

export default function getSkillConfigForDisplay(skill: Skill): SkillConfig {
  switch (skill) {
    case Skill.AttackIncreaseMinor:
      return {
        alpha: 0.15,
        borderStyle: 'up',
        colors: 'red',
        icon: Crosshair,
        name: fbt('Attack Up', 'Skill name'),
      };
    case Skill.DefenseIncreaseMinor:
      return {
        alpha: 0.15,
        borderStyle: 'up',
        colors: 'blue',
        icon: ShieldSolid,
        name: fbt('Defense Up', 'Skill name'),
      };
    case Skill.AttackIncreaseMajorDefenseDecreaseMajor:
      return {
        alpha: 0.3,
        borderStyle: 'up2x',
        colors: ['red', 'blue'],
        icon: AggressiveStance,
        name: fbt('Aggressive Stance', 'Skill name'),
      };
    case Skill.BuyUnitCannon:
      return {
        alpha: 0.15,
        borderStyle: 'unfold',
        colors: 'green',
        icon: Coin,
        name: fbt('Loose Cannon', 'Skill name'),
      };
    case Skill.BuyUnitBrute:
      return {
        alpha: 0.15,
        borderStyle: 'up2x',
        colors: ['green', 'blue'],
        icon: Angry,
        name: fbt('Brutal Call', 'Skill name'),
      };
    case Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor:
      return {
        alpha: 0.15,
        borderStyle: 'down',
        colors: 'purple',
        icon: Scissors,
        name: fbt('Cheap Trick', 'Skill name'),
      };
    case Skill.UnitAbilitySniperImmediateAction:
      return {
        alpha: 0.15,
        borderStyle: 'fold',
        colors: 'orange',
        icon: Gps2,
        name: fbt('Maximum Sniper', 'Skill name'),
      };
    case Skill.MovementIncreaseGroundUnitDefenseDecrease:
      return {
        alpha: 0.15,
        borderStyle: 'move',
        colors: 'pink',
        icon: Bullseye,
        name: fbt('Rapid Maneuver', 'Skill name'),
      };
    case Skill.UnitBattleShipMoveAndAct:
      return {
        alpha: 0.15,
        borderStyle: 'move',
        colors: 'orange',
        icon: Ship,
        name: fbt('Hit Hard, Hit Fast, Hit Often', 'Skill name'),
      };
    case Skill.BuyUnitSuperAPU:
      return {
        alpha: 0.5,
        borderStyle: 'up2x',
        colors: ['orange', 'purple'],
        icon: Robot,
        name: fbt('Super APU', 'Skill name'),
      };
    case Skill.BuyUnitZombieDefenseDecreaseMajor:
      return {
        alpha: 0.15,
        borderStyle: 'coin',
        colors: 'neutral',
        icon: Zombie,
        name: fbt('Zombie Horde', 'Skill name'),
      };
    case Skill.BuyUnitBazookaBear:
      return {
        alpha: 0.15,
        borderStyle: 'coin',
        colors: ['green', 'purple'],
        icon: Paw,
        name: fbt("Bazoo's Bond", 'Skill name'),
      };
    case Skill.AttackAndDefenseIncreaseHard:
      return {
        alpha: 0.3,
        borderStyle: 'up',
        colors: 'red',
        icon: Sword,
        name: fbt('Fierce Assault', 'Skill name'),
      };
    case Skill.HealVehiclesAttackDecrease:
      return {
        alpha: 0.15,
        borderStyle: 'down',
        colors: 'pink',
        icon: Trash,
        name: fbt('Junkyard Scraps', 'Skill name'),
      };
    case Skill.ArtilleryRangeIncrease:
      return {
        alpha: 0.3,
        borderStyle: 'up',
        colors: 'cyan',
        icon: BullseyeArrow,
        name: fbt('Artillery Expert', 'Skill name'),
      };
    case Skill.HealInfantryMedicPower:
      return {
        alpha: 0.3,
        borderStyle: 'up',
        colors: ['pink', 'purple'],
        icon: Heart,
        name: fbt('Surge of Vitality', 'Skill name'),
      };
    case Skill.NoUnitRestrictions:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'neutral',
        icon: Loader,
        name: fbt('No Limits', 'Skill name'),
      };
    case Skill.CounterAttackPower:
      return {
        alpha: 1,
        borderStyle: 'full',
        colors: 'orange',
        icon: Redo,
        name: fbt('Super Counter', 'Skill name'),
      };
    case Skill.AttackAndDefenseDecreaseEasy:
      return {
        alpha: 0.1,
        borderStyle: 'down',
        colors: 'pink',
        icon: Balloon,
        name: fbt('Easy Mode', 'Skill name'),
      };
    case Skill.UnitInfantryForestAttackAndDefenseIncrease:
      return {
        alpha: 0.3,
        borderStyle: 'plus',
        colors: 'cyan',
        icon: Tree,
        name: fbt('Forester', 'Skill name'),
      };
    case Skill.UnitRailDefenseIncreasePowerAttackIncrease:
      return {
        alpha: 0.3,
        borderStyle: 'up',
        colors: 'blue',
        icon: Track,
        name: fbt('Train Guard', 'Skill name'),
      };
    case Skill.BuyUnitAIU:
      return {
        alpha: 0.5,
        borderStyle: 'coin',
        colors: ['red', 'pink'],
        icon: Skull,
        name: fbt('Determined Termination', 'Skill name'),
      };
    case Skill.BuyUnitCommander:
      return {
        alpha: 0.35,
        borderStyle: 'coin',
        colors: ['purple', 'red'],
        icon: Medal,
        name: fbt('Commanding Force', 'Skill name'),
      };
    case Skill.RecoverAirUnits:
      return {
        alpha: 0.5,
        borderStyle: 'up',
        colors: 'green',
        icon: Repeat,
        name: fbt('Eagle Eye', 'Skill name'),
      };
    case Skill.BuyUnitAlien:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'purple',
        icon: Alien,
        name: fbt('Alien Invasion', 'Skill name'),
      };
    case Skill.BuyUnitOctopus:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'cyan',
        icon: Octopus,
        name: fbt('Octo Wrath', 'Skill name'),
      };
    case Skill.BuyUnitAcidBomber:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'cyan',
        icon: Poison,
        name: fbt('Acid Rain', 'Skill name'),
      };
    case Skill.BuyUnitSuperTank:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'red',
        icon: SuperTank,
        name: fbt('Super Tank', 'Skill name'),
      };
    case Skill.BuyUnitDinosaur:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'cyan',
        icon: Dinosaur,
        name: fbt('Dino Rampage', 'Skill name'),
      };
    case Skill.Sabotage:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'purple',
        icon: SabotageIcon,
        name: fbt('Sneaky Sabotage', 'Skill name'),
      };
    case Skill.SpawnUnitInfernoJetpack:
      return {
        alpha: 1,
        borderStyle: 'crystal',
        colors: ['red', 'orange'],
        icon: Fire,
        name: fbt('Inferno', 'Skill name'),
        textColor: '#fff',
      };
    case Skill.UnlockZombie:
      return {
        alpha: 0.3,
        borderStyle: 'down',
        colors: 'neutral',
        icon: Zombie,
        name: fbt('Last Resort', 'Skill name'),
      };
    case Skill.UnlockPowerStation:
      return {
        alpha: 0.5,
        borderStyle: 'up2x',
        colors: 'orange',
        icon: ZapOn,
        name: fbt('More Power', 'Skill name'),
      };
    case Skill.BuyUnitDragon:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'red',
        icon: Fire,
        name: fbt('Dragon Fire', 'Skill name'),
      };
    case Skill.BuyUnitBear:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'red',
        icon: Paw,
        name: fbt('Wild Companion', 'Skill name'),
      };
    case Skill.BuyUnitOgre:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'cyan',
        icon: Ogre,
        name: fbt('Large Footprint', 'Skill name'),
      };
    case Skill.VampireHeal:
      return {
        alpha: 0.3,
        borderStyle: 'up',
        colors: 'red',
        icon: DropHalf,
        name: fbt('Blood Moon', 'Skill name'),
      };
    case Skill.Shield:
      return {
        alpha: 0.1,
        borderStyle: 'crystal',
        colors: 'blue',
        icon: Bubble,
        name: fbt('Bubble Wrap', 'Skill name'),
      };
    case Skill.Charge:
      return {
        alpha: 0.1,
        borderStyle: 'crystal',
        colors: 'orange',
        icon: Charge,
        name: fbt('Charge Overflow', 'Skill name'),
      };
    case Skill.DragonSaboteur:
      return {
        alpha: 0.1,
        borderStyle: 'up2x',
        colors: ['purple', 'blue'],
        icon: Glasses,
        name: fbt('Sneaky Dragon', 'Skill name'),
      };
    case Skill.HighTide:
      return {
        alpha: 0.3,
        borderStyle: 'down',
        colors: ['blue', 'purple'],
        icon: Tide,
        name: fbt('High Tide', 'Skill name'),
      };
    case Skill.Jeep:
      return {
        alpha: 0.3,
        borderStyle: 'coin',
        colors: 'pink',
        icon: Seatbelt,
        name: fbt('Seatbelts On', 'Skill name'),
      };
    case Skill.ShipIncreaseAttackAndRange:
      return {
        alpha: 0.3,
        borderStyle: 'up2x',
        colors: 'red',
        icon: Seafarer,
        name: fbt('Seafarer', 'Skill name'),
      };
    case Skill.XFighterAttackIncrase:
      return {
        alpha: 0.5,
        borderStyle: 'plus',
        colors: 'pink',
        icon: Ungroup,
        name: fbt("Amira's Ace", 'Skill name'),
      };
    case Skill.CostRecovery:
      return {
        alpha: 0.5,
        borderStyle: 'up',
        colors: 'orange',
        icon: Receipt,
        name: fbt('Insurance Claims', 'Skill name'),
      };
    case Skill.UnlockScientist:
      return {
        alpha: 0.1,
        borderStyle: 'up',
        colors: 'green',
        icon: Flask,
        name: fbt('Field Research', 'Skill name'),
      };
    case Skill.BuyUnitHumveeAvenger:
      return {
        alpha: 0.3,
        borderStyle: 'up2x',
        colors: 'blue',
        icon: Gps,
        name: fbt('Locked On', 'Skill name'),
      };
    case Skill.BuyUnitDroneBomber:
      return {
        alpha: 0.6,
        borderStyle: 'up2x',
        colors: 'orange',
        icon: RadioSignal,
        name: fbt('Drone Swarm', 'Skill name'),
      };
    default: {
      skill satisfies never;
      throw new UnknownTypeError('getSkillConfig', skill);
    }
  }
}
