import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import type { Skill } from '../info/Skill.tsx';
import { Skills } from '../info/Skill.tsx';

type SkillReward = Readonly<{
  skill: Skill;
  type: 'skill';
}>;

type EncodedSkillReward = readonly [type: 0, skill: Skill];

export type Reward = SkillReward;
export type EncodedReward = EncodedSkillReward;
export type PlainReward = EncodedReward;

export function isSkillReward(reward: Reward): reward is SkillReward {
  return reward.type === 'skill';
}

export function encodeReward(reward: Reward): EncodedReward {
  switch (reward.type) {
    case 'skill':
      return [0, reward.skill];
    default:
      reward.type satisfies never;
      throw new UnknownTypeError('encodeReward', reward.type);
  }
}

export function decodeReward([rewardType, ...rest]: EncodedReward): Reward {
  switch (rewardType) {
    case 0:
      return { skill: rest[0], type: 'skill' };
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
  switch (reward.type) {
    case 'skill':
      return `Reward { skill: ${reward.skill} }`;
    default:
      reward.type satisfies never;
      throw new UnknownTypeError('formatReward', reward.type);
  }
}

export function validateReward(reward: Reward): boolean {
  switch (reward.type) {
    case 'skill':
      return Skills.has(reward.skill);
    default:
      return false;
  }
}
