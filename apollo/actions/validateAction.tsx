import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import { MaxMessageLength } from '@deities/athena/map/Configuration.tsx';
import { toDynamicPlayerID } from '@deities/athena/map/Player.tsx';
import sanitizeText from '@deities/hephaestus/sanitizeText.tsx';
import { Action } from '../Action.tsx';

export default function validateAction(action: Action) {
  if (action.type !== 'CharacterMessageEffect') {
    return null;
  }

  try {
    toDynamicPlayerID(action.player);
  } catch {
    return null;
  }

  const unit = getUnitInfo(action.unitId);
  if (!unit) {
    return null;
  }

  if (
    action.variant != null &&
    (action.variant > (unit.sprite.portrait.variants || 0) - 1 ||
      action.variant < 0)
  ) {
    return null;
  }

  const message = sanitizeText(action.message);
  if (message.length > MaxMessageLength) {
    return null;
  }

  return { ...action, message };
}
