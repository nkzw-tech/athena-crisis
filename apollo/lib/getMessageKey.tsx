import { CharacterMessageEffectAction } from '../Action.tsx';
import { CharacterMessageActionResponse } from '../ActionResponse.tsx';
import jenkinsHash from './jenkinsHash.tsx';

export default function getMessageKey(
  action: CharacterMessageEffectAction | CharacterMessageActionResponse,
) {
  return jenkinsHash(
    `$$${action.unitId}$$${action.player}$$${action.variant || 0}$$${
      action.message
    }`,
  );
}
