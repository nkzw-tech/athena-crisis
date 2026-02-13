import { MinFunds } from '../info/Building.tsx';
import { Charge, MaxHealth } from '../map/Configuration.tsx';
import Entity, { isBuilding, isUnit } from '../map/Entity.tsx';
import Player from '../map/Player.tsx';
import getUnitValue from './getUnitValue.tsx';

export default function getChargeValue(
  entity: Entity,
  player: Player,
  newEntity: Entity,
  modifier: number,
) {
  if (!isUnit(entity)) {
    if (!newEntity.isDead()) {
      return 0;
    }
    let cost = isBuilding(newEntity) ? newEntity.info.getCostFor(player) : MinFunds;

    if (cost === Number.POSITIVE_INFINITY) {
      cost = MinFunds * 10;
    }

    return Math.floor((Charge * 2) / 3 + cost * 2);
  }

  const value = getUnitValue(entity, player);
  const difference = entity.health - newEntity.health;
  return Math.floor(value * (difference / MaxHealth) * modifier);
}
