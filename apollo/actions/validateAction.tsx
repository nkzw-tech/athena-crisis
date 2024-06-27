import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import { validateUnit } from '@deities/athena/lib/validateMap.tsx';
import { MaxMessageLength } from '@deities/athena/map/Configuration.tsx';
import { isDynamicPlayerID, toPlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import sanitizeText from '@deities/hephaestus/sanitizeText.tsx';
import {
  Action,
  CharacterMessageEffectAction,
  SpawnEffectAction,
} from '../Action.tsx';

const validateCharacterMessage = (action: CharacterMessageEffectAction) => {
  const { message: initialMessage, player, unitId, variant } = action;

  if (!isDynamicPlayerID(player)) {
    return null;
  }

  const unit = getUnitInfo(unitId);
  if (!unit) {
    return null;
  }

  if (
    variant != null &&
    (variant < 0 || variant >= unit.sprite.portrait.variants)
  ) {
    return null;
  }

  const message = sanitizeText(initialMessage);
  if (message.length > MaxMessageLength) {
    return null;
  }

  return { ...action, message };
};

const validateSpawnEffect = (map: MapData, action: SpawnEffectAction) => {
  const { player, teams, units: initialUnits } = action;
  if (player != null && !isDynamicPlayerID(player)) {
    return null;
  }

  const units = initialUnits.map((unit) => unit.removeLeader());
  if (!units.size || !units.some((unit) => validateUnit(unit, new Map()))) {
    return null;
  }

  if (
    teams != null &&
    teams.size > 0 &&
    teams.every(
      ({ id, players }) =>
        !!toPlayerID(id) &&
        !map.maybeGetTeam(id) &&
        players.size > 0 &&
        players.every(
          (player) => !!toPlayerID(player.id) && !map.maybeGetPlayer(player.id),
        ),
    )
  ) {
    return null;
  }

  return { ...action, units };
};

export default function validateAction(map: MapData, action: Action) {
  switch (action.type) {
    case 'CharacterMessageEffect':
      return validateCharacterMessage(action);
    case 'SpawnEffect':
      return validateSpawnEffect(map, action);
  }

  return null;
}
