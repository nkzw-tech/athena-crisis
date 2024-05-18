import type { UnitInfo } from '@deities/athena/info/Unit.tsx';
import {
  getAllUnits,
  getUnitInfo,
  Pioneer,
} from '@deities/athena/info/Unit.tsx';
import type { Bot } from '@deities/athena/map/Player.tsx';
import type { UserLike } from '../hooks/useUserMap.tsx';

const getUnit = (name: string): UnitInfo =>
  getUnitInfo(
    (Array.from(name)
      .map((character) => character.codePointAt(0) || 0)
      .reduce((a, b) => a + b, 0) %
      (getAllUnits().length - 1)) +
      1,
  ) || Pioneer;

export default function botToUser(bot: Bot): UserLike {
  const unit = getUnit(bot.name);
  return {
    character: {
      unitId: unit.id,
      variant: bot.name.length % unit.sprite.portrait.variants,
    },
    displayName: bot.name,
    username: bot.name,
  } as const;
}
