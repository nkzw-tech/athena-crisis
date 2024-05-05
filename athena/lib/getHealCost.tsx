import { HealAmount, MaxHealth } from '../map/Configuration.tsx';
import Player from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import getUnitValue from './getUnitValue.tsx';

export default function getHealCost(unit: Unit, player: Player) {
  return Math.round(
    ((Math.min(MaxHealth, unit.health + HealAmount) - unit.health) /
      MaxHealth) *
      getUnitValue(unit, player) *
      0.8,
  );
}
