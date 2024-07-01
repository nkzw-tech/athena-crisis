import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { useCallback } from 'react';

export default function usePlayerHasReward({
  id,
  portraits,
  skills,
}: {
  id: string;
  portraits: ReadonlyArray<number>;
  skills: ReadonlyArray<Skill>;
}) {
  return useCallback(
    (
      map: MapData,
      playerID: PlayerID,
      actionResponse: ReceiveRewardActionResponse,
    ) => {
      const player = map.getPlayerByUserId(id);
      if (!player || player.id !== playerID) {
        return false;
      }

      const { reward } = actionResponse;
      const rewardType = reward.type;
      switch (rewardType) {
        case 'Skill':
          return skills.includes(reward.skill);
        case 'UnitPortraits':
          return portraits.includes(reward.unit.id);
        default: {
          rewardType satisfies never;
          throw new UnknownTypeError('usePlayerHasReward', rewardType);
        }
      }
    },
    [id, portraits, skills],
  );
}
