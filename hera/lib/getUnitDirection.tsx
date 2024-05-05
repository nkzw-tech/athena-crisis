import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';

export default function getUnitDirection(firstPlayer: PlayerID, unit: Unit) {
  return (unit.player === 0 || (firstPlayer + unit.player - 1) % 2 ? -1 : 1) *
    unit.info.sprite.direction ===
    -1
    ? 'left'
    : 'right';
}
