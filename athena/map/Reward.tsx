import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { Skill, Skills } from '../info/Skill.tsx';
import { getUnitInfo, getUnitInfoOrThrow, UnitInfo } from '../info/Unit.tsx';

export type SkillReward = Readonly<{
  skill: Skill;
  type: 'Skill';
}>;

type UnitPortraitsReward = Readonly<{
  type: 'UnitPortraits';
  unit: UnitInfo;
}>;

type EncodedSkillReward =
  | readonly [type: 0, skill: Skill]
  | readonly [type: 1, unit: number];

export type Reward = UnitPortraitsReward | SkillReward;
export type EncodedReward = EncodedSkillReward;
export type PlainReward = EncodedReward;

export function encodeReward(reward: Reward): EncodedReward {
  const rewardType = reward.type;
  switch (rewardType) {
    case 'Skill':
      return [0, reward.skill];
    case 'UnitPortraits':
      return [1, reward.unit.id];
    default:
      rewardType satisfies never;
      throw new UnknownTypeError('encodeReward', rewardType);
  }
}

export function decodeReward([rewardType, ...rest]: EncodedReward): Reward {
  switch (rewardType) {
    case 0:
      return { skill: rest[0], type: 'Skill' };
    case 1:
      return { type: 'UnitPortraits', unit: getUnitInfoOrThrow(rest[0]) };
    default:
      rewardType satisfies never;
      throw new UnknownTypeError('decodeReward', rewardType);
  }
}

export function maybeEncodeReward(
  reward: Reward | null | undefined,
): EncodedReward | null {
  return reward ? encodeReward(reward) : null;
}

export function maybeDecodeReward(
  reward: EncodedReward | null | undefined,
): Reward | null {
  return reward ? decodeReward(reward) : null;
}

export function formatReward(reward: Reward): string {
  const rewardType = reward.type;
  switch (rewardType) {
    case 'Skill':
      return `Reward { skill: ${reward.skill} }`;
    case 'UnitPortraits':
      return `Reward { unit: ${reward.unit.name} }`;
    default:
      rewardType satisfies never;
      throw new UnknownTypeError('formatReward', rewardType);
  }
}

export function validateReward(reward: Reward): boolean {
  switch (reward.type) {
    case 'Skill':
      return Skills.has(reward.skill);
    case 'UnitPortraits':
      return !!getUnitInfo(reward.unit.id);
    default:
      return false;
  }
}
