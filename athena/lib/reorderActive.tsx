import { PlayerID } from '../map/Player.tsx';

export default function reorderActive(
  active: ReadonlyArray<PlayerID>,
  id: PlayerID,
) {
  const index = active.indexOf(id);
  return index === -1
    ? active
    : [...active.slice(index), ...active.slice(0, index)];
}
