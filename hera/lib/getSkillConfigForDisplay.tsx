import { Skill } from '@deities/athena/info/Skill.tsx';
import { BaseColor } from '@deities/ui/getColor.tsx';
import { SVGIcon } from '@deities/ui/Icon.tsx';
import Alien from '@deities/ui/icons/Alien.tsx';
import Bubble from '@deities/ui/icons/Bubble.tsx';
import Crosshair from '@deities/ui/icons/Crosshair.tsx';
import Fire from '@deities/ui/icons/Fire.tsx';
import Flask from '@deities/ui/icons/Flask.tsx';
import Glasses from '@deities/ui/icons/Glasses.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Medal from '@deities/ui/icons/Medal.tsx';
import Octopus from '@deities/ui/icons/Octopus.tsx';
import Ogre from '@deities/ui/icons/Ogre.tsx';
import Paw from '@deities/ui/icons/Paw.tsx';
import Poison from '@deities/ui/icons/Poison.tsx';
import Seatbelt from '@deities/ui/icons/Seatbelt.tsx';
import { SkillIconBorderStyle } from '@deities/ui/icons/SkillBorder.tsx';
import Skull from '@deities/ui/icons/Skull.tsx';
import Tide from '@deities/ui/icons/Tide.tsx';
import Track from '@deities/ui/icons/Track.tsx';
import Tree from '@deities/ui/icons/Tree.tsx';
import Zombie from '@deities/ui/icons/Zombie.tsx';
import Charge from '@iconify-icons/pixelarticons/ac.js';
import BullseyeArrow from '@iconify-icons/pixelarticons/bullseye-arrow.js';
import Bullseye from '@iconify-icons/pixelarticons/bullseye.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import Dinosaur from '@iconify-icons/pixelarticons/downasaur.js';
import DropHalf from '@iconify-icons/pixelarticons/drop-half.js';
import SuperTank from '@iconify-icons/pixelarticons/label-alt-multiple.js';
import Loader from '@iconify-icons/pixelarticons/loader.js';
import RadioSignal from '@iconify-icons/pixelarticons/radio-signal.js';
import Repeat from '@iconify-icons/pixelarticons/repeat.js';
import Shield from '@iconify-icons/pixelarticons/shield.js';
import Ship from '@iconify-icons/pixelarticons/ship.js';
import SpeedSlow from '@iconify-icons/pixelarticons/speed-slow.js';
import Ungroup from '@iconify-icons/pixelarticons/ungroup.js';
import Zap from '@iconify-icons/pixelarticons/zap.js';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { fbt } from 'fbtee';

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
        icon: Shield,
        name: fbt('Defense Up', 'Skill name'),
      };
    case Skill.AttackIncreaseMajorDefenseDecreaseMajor:
      return {
        alpha: 0.3,
        borderStyle: 'up2x',
        colors: ['red', 'blue'],
        icon: Crosshair,
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
        icon: Coin,
        name: fbt('Brutal Call', 'Skill name'),
      };
    case Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor:
      return {
        alpha: 0.15,
        borderStyle: 'down',
        colors: 'purple',
        icon: Coin,
        name: fbt('Cheap Trick', 'Skill name'),
      };
    case Skill.UnitAbilitySniperImmediateAction:
      return {
        alpha: 0.15,
        borderStyle: 'fold',
        colors: 'orange',
        icon: Crosshair,
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
        icon: Crosshair,
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
        icon: Crosshair,
        name: fbt('Fierce Assault', 'Skill name'),
      };
    case Skill.HealVehiclesAttackDecrease:
      return {
        alpha: 0.15,
        borderStyle: 'down',
        colors: 'pink',
        icon: Heart,
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
        icon: Crosshair,
        name: fbt('Super Counter', 'Skill name'),
      };
    case Skill.AttackAndDefenseDecreaseEasy:
      return {
        alpha: 0.1,
        borderStyle: 'down',
        colors: 'pink',
        icon: SpeedSlow,
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
        icon: Repeat,
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
        icon: Zap,
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
        icon: Ship,
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
        icon: Coin,
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
        icon: Ungroup,
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
