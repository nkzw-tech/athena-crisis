import jenkinsHash from '@deities/hephaestus/jenkinsHash.tsx';
import type { CharacterMessageEffectAction } from '../Action.tsx';
import type { CharacterMessageActionResponse } from '../ActionResponse.tsx';

export default function getMessageKey(
  action: CharacterMessageEffectAction | CharacterMessageActionResponse,
) {
  return jenkinsHash(
    `$$${action.unitId}$$${action.player}$$${action.variant || 0}$$${
      action.message
    }`,
  );
}
