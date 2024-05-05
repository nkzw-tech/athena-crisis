import { MinFunds } from '../info/Building.tsx';
import { Charge, MaxHealth } from '../map/Configuration.tsx';
import Entity, { isBuilding, isUnit } from '../map/Entity.tsx';
import Player from '../map/Player.tsx';
import getUnitValue from './getUnitValue.tsx';

export default function getChargeValue(
  entity: Entity,
  player: Player,
  newEntity: Entity,
  modifier = 1,
) {
  if (!isUnit(entity)) {
    return newEntity.isDead()
      ? Math.floor(
          (Charge * 2) / 3 +
            (isBuilding(newEntity)
              ? newEntity.info.configuration.cost
              : MinFunds) *
              2,
        )
      : 0;
  }

  const value = getUnitValue(entity, player);
  const difference = entity.health - newEntity.health;
  return Math.floor(value * (difference / MaxHealth) * modifier);
}
