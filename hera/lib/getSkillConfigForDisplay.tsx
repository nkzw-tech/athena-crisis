import { Skill } from '@deities/athena/info/Skill.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { BaseColor } from '@deities/ui/getColor.tsx';
import { SVGIcon } from '@deities/ui/Icon.tsx';
import Crosshair from '@deities/ui/icons/Crosshair.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Paw from '@deities/ui/icons/Paw.tsx';
import { SkillIconBorderStyle } from '@deities/ui/icons/SkillBorder.tsx';
import Skull from '@deities/ui/icons/Skull.tsx';
import Track from '@deities/ui/icons/Track.tsx';
import Tree from '@deities/ui/icons/Tree.tsx';
import Zombie from '@deities/ui/icons/Zombie.tsx';
import BullseyeArrow from '@iconify-icons/pixelarticons/bullseye-arrow.js';
import Bullseye from '@iconify-icons/pixelarticons/bullseye.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import Loader from '@iconify-icons/pixelarticons/loader.js';
import Shield from '@iconify-icons/pixelarticons/shield.js';
import SpeedSlow from '@iconify-icons/pixelarticons/speed-slow.js';
import { fbt } from 'fbt';

type SkillConfig = Readonly<{
  alpha?: number;
  borderStyle?: SkillIconBorderStyle;
  colors: BaseColor | ReadonlyArray<BaseColor>;
  icon: SVGIcon;
  name: string;
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
        icon: Crosshair,
        name: fbt('Hit Hard, Hit Fast, Hit Often', 'Skill name'),
      };
    case Skill.UnitAPUAttackIncreaseMajorPower:
      return {
        alpha: 0.3,
        borderStyle: 'up2x',
        colors: ['red', 'purple'],
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
    case Skill.UnitInfantryForestDefenseIncrease:
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
        colors: ['green', 'cyan'],
        icon: Skull,
        name: fbt('Determined Termination', 'Skill name'),
      };
    default: {
      skill satisfies never;
      throw new UnknownTypeError('getSkillConfig', skill);
    }
  }
}
