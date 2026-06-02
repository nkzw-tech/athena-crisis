import { PlayerID, PlayerIDs, ReleasedPlayerIDs } from '@deities/athena/map/Player.tsx';

export default function getEditorPlayerIDs(isAdmin?: boolean): ReadonlyArray<PlayerID> {
  return isAdmin ? PlayerIDs : ReleasedPlayerIDs;
}

export function isEditorPlayerID(id: PlayerID, isAdmin?: boolean): boolean {
  return getEditorPlayerIDs(isAdmin).includes(id);
}
