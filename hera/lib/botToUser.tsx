import { getAllUnits, getUnitInfo, Pioneer, UnitInfo } from '@deities/athena/info/Unit.tsx';
import { Bot } from '@deities/athena/map/Player.tsx';
import { UserLike } from '../hooks/useUserMap.tsx';
import getSkillBasedPortrait from './getSkillBasedPortrait.tsx';

const getUnit = (name: string): UnitInfo =>
  getUnitInfo(
    (Array.from(name)
      .map((character) => character.codePointAt(0) || 0)
      .reduce((a, b) => a + b, 0) %
      (getAllUnits().length - 1)) +
      1,
  ) || Pioneer;

export default function botToUser(bot: Bot): UserLike {
  let unit: UnitInfo | null = null;
  for (const skill of bot.skills) {
    unit = getSkillBasedPortrait(skill);
    if (unit) {
      break;
    }
  }

  if (!unit) {
    unit = getUnit(bot.name);
  }

  return {
    character: {
      color: 1,
      unitId: unit.id,
      variant: bot.name.length % unit.sprite.portrait.variants,
    },
    displayName: bot.name,
    username: bot.name,
  } as const;
}
