import { EntityGroup, EntityType } from '@deities/athena/map/Entity.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbt';

export default function getTranslatedEntityName(entityType: EntityType) {
  switch (entityType) {
    case EntityType.Airplane:
      return String(fbt('Airplane', 'Entity name'));
    case EntityType.AirInfantry:
      return String(fbt('Air Infantry', 'Entity name'));
    case EntityType.Amphibious:
      return String(fbt('Amphibious', 'Entity name'));
    case EntityType.Artillery:
      return String(fbt('Artillery', 'Entity name'));
    case EntityType.Building:
      return String(fbt('Building', 'Entity name'));
    case EntityType.Ground:
      return String(fbt('Vehicle', 'Entity name'));
    case EntityType.LowAltitude:
      return String(fbt('Low Altitude', 'Entity name'));
    case EntityType.Infantry:
      return String(fbt('Infantry', 'Entity name'));
    case EntityType.Invincible:
      return String(fbt('Invincible', 'Entity name'));
    case EntityType.Ship:
      return String(fbt('Ship', 'Entity name'));
    case EntityType.Structure:
      return String(fbt('Structure', 'Entity name'));
    case EntityType.Rail:
      return String(fbt('Rail', 'Entity name'));
    default: {
      entityType satisfies never;
      throw new UnknownTypeError('getTranslatedEntityName', entityType);
    }
  }
}

export function getTranslatedEntityGroupName(group: EntityGroup) {
  switch (group) {
    case 'air':
      return String(fbt('Air', 'Entity group name'));
    case 'land':
      return String(fbt('Land', 'Entity group name'));
    case 'naval':
      return String(fbt('Naval', 'Entity group name'));
    case 'building':
      return String(fbt('Building', 'Entity group name'));
    default: {
      group satisfies never;
      throw new UnknownTypeError('getTranslatedEntityGroupName', group);
    }
  }
}
