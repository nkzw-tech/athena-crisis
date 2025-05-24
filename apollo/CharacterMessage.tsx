import { getUnitInfoOrThrow, UnitInfo } from '@deities/athena/info/Unit.tsx';
import { DynamicPlayerID } from '@deities/athena/map/Player.tsx';

export default function CharacterMessage(
  unit: UnitInfo | number,
  message: string,
  player: DynamicPlayerID,
  variant?: number,
  silhouette = false,
) {
  return {
    message,
    player,
    silhouette,
    type: 'CharacterMessageEffect',
    unitId: (typeof unit === 'number' ? getUnitInfoOrThrow(unit) : unit).id,
    variant,
  } as const;
}
