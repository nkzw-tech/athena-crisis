import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
import { Crystals } from '@deities/athena/invasions/Crystal.tsx';
import { validateUnit } from '@deities/athena/lib/validateMap.tsx';
import { Biomes } from '@deities/athena/map/Biome.tsx';
import { MaxCharges, MaxMessageLength } from '@deities/athena/map/Configuration.tsx';
import { isDynamicPlayerID, toPlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  Action,
  ActivateCrystalAction,
  CharacterMessageEffectAction,
  IncreaseChargeEffectAction,
  IncreaseFundsEffectAction,
  SpawnEffectAction,
} from '../Action.tsx';
import sanitizeText from '../lib/sanitizeText.tsx';

const validateCharacterMessage = (action: CharacterMessageEffectAction) => {
  const { message: initialMessage, player, unitId, variant } = action;

  if (!isDynamicPlayerID(player)) {
    return null;
  }

  const unit = getUnitInfo(unitId);
  if (!unit) {
    return null;
  }

  if (variant != null && (variant < 0 || variant >= unit.sprite.portrait.variants)) {
    return null;
  }

  const message = sanitizeText(initialMessage);
  if (message.length > MaxMessageLength) {
    return null;
  }

  return { ...action, message };
};

const isValidPlayerID = (id: number) => {
  try {
    toPlayerID(id);
    return true;
  } catch {
    return false;
  }
};

const isValidSpawnUnit = (unit: ReturnType<SpawnEffectAction['units']['get']>) => {
  if (!unit) {
    return false;
  }

  try {
    return validateUnit(unit, new Map());
  } catch {
    return false;
  }
};

const validateSpawnTeams = (map: MapData, teams: SpawnEffectAction['teams']) =>
  teams?.filter((team, teamID) => {
    if (!isValidPlayerID(teamID) || team.id !== teamID || !team.players.size) {
      return false;
    }

    for (const [playerID, player] of team.players) {
      if (!isValidPlayerID(playerID) || player.id !== playerID || player.teamId !== teamID) {
        return false;
      }

      const maybePlayer = map.maybeGetPlayer(playerID);
      if (maybePlayer && (maybePlayer.type === player.type || maybePlayer.teamId !== teamID)) {
        return false;
      }
    }

    return true;
  });

const validateSpawnEffect = (map: MapData, action: SpawnEffectAction) => {
  const { player, teams, units: initialUnits } = action;
  if (player != null && !isDynamicPlayerID(player)) {
    return null;
  }

  const units = initialUnits.map((unit) => unit.removeLeader()).filter(isValidSpawnUnit);
  if (!units.size) {
    return null;
  }

  const validTeams = validateSpawnTeams(map, teams);

  return { ...action, teams: validTeams?.size ? validTeams : undefined, units };
};

const validateActivateCrystal = (action: ActivateCrystalAction) => {
  if (action.biome != null && !Biomes.includes(action.biome)) {
    return null;
  }

  return Crystals.includes(action.crystal) ? action : null;
};

const validateIncreaseCharge = (action: IncreaseChargeEffectAction) => {
  const { charges, player } = action;
  if (!isDynamicPlayerID(player)) {
    return null;
  }

  return charges > 0 && charges <= MaxCharges ? action : null;
};

const validateIncreaseFunds = (action: IncreaseFundsEffectAction) => {
  const { funds, player } = action;
  if (!isDynamicPlayerID(player)) {
    return null;
  }

  return funds > 0 && funds <= Number.MAX_SAFE_INTEGER ? action : null;
};

export default function validateAction(map: MapData, action: Action) {
  switch (action.type) {
    case 'CharacterMessageEffect':
      return validateCharacterMessage(action);
    case 'SpawnEffect':
      return validateSpawnEffect(map, action);
    case 'ActivateCrystal':
      return validateActivateCrystal(action);
    case 'IncreaseChargeEffect':
      return validateIncreaseCharge(action);
    case 'IncreaseFundsEffect':
      return validateIncreaseFunds(action);
  }

  return null;
}
