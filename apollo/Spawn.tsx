import { PlainEntitiesList } from '@deities/athena/map/PlainMap.tsx';
import { DynamicPlayerID } from '@deities/athena/map/Player.tsx';
import {
  decodeTeams,
  decodeUnits,
} from '@deities/athena/map/Serialization.tsx';
import { PlainTeams } from '@deities/athena/map/Team.tsx';
import { PlainUnit } from '@deities/athena/map/Unit.tsx';
import { SpawnEffectAction } from './Action.tsx';

export default function Spawn(
  units: PlainEntitiesList<PlainUnit>,
  player?: DynamicPlayerID | undefined,
  teams?: PlainTeams | undefined,
): SpawnEffectAction {
  return {
    player,
    teams: teams ? decodeTeams(teams) : undefined,
    type: 'SpawnEffect',
    units: decodeUnits(units),
  } as const;
}
