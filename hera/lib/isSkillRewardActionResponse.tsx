import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { SkillReward } from '@deities/athena/map/Reward.tsx';

export type SkillRewardActionResponse = Omit<
  ReceiveRewardActionResponse,
  'reward'
> &
  Readonly<{
    reward: SkillReward;
  }>;

export default function isSkillRewardActionResponse(
  actionResponse: ReceiveRewardActionResponse,
): actionResponse is SkillRewardActionResponse {
  return actionResponse.reward.type === 'Skill';
}
