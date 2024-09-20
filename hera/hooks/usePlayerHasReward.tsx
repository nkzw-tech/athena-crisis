import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { useCallback } from 'react';

export default function usePlayerHasReward(
  {
    biomes,
    id,
    keyart,
    portraits,
    skills,
    unlockedSkillSlots,
  }: {
    biomes: ReadonlyArray<Biome>;
    id: string;
    keyart: ReadonlyArray<number>;
    portraits: ReadonlyArray<number>;
    skills: ReadonlyArray<Skill>;
    unlockedSkillSlots: ReadonlyArray<number>;
  },
  hasCrystal: () => boolean,
) {
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
        case 'Keyart':
          return keyart.includes(reward.variant);
        case 'Biome':
          return biomes.includes(reward.biome);
        case 'SkillSlot':
          return unlockedSkillSlots.includes(reward.slot);
        case 'Crystal':
          return !hasCrystal();
        default: {
          rewardType satisfies never;
          throw new UnknownTypeError('usePlayerHasReward', rewardType);
        }
      }
    },
    [biomes, hasCrystal, id, keyart, portraits, skills, unlockedSkillSlots],
  );
}
