import { CharacterMessageEffectAction } from '@deities/apollo/Action.tsx';
import { CharacterMessageActionResponse } from '@deities/apollo/ActionResponse.tsx';
import getMessageKey from '@deities/apollo/lib/getMessageKey.tsx';
import CampaignMap from './CampaignMap.tsx';

type MessageKey = keyof typeof CampaignMap;

export default function translateMessage(
  action: CharacterMessageEffectAction | CharacterMessageActionResponse,
): string {
  // It's possible that a message is translated but was recently changed. If it dropped any params, `fbt` will throw an error.
  // In this case, fall back to the original message.
  try {
    return (
      CampaignMap[getMessageKey(action) as MessageKey]?.() || action.message
    );
  } catch {
    /* empty */
  }

  return action.message;
}
