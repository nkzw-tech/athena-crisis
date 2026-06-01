import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';

const DarkAthenaPlayerID: PlayerID = 8;

export default function getEditorPlayerIDs(isAdmin?: boolean): ReadonlyArray<PlayerID> {
  return isAdmin ? PlayerIDs : PlayerIDs.filter((id) => id !== DarkAthenaPlayerID);
}

export function isEditorPlayerID(id: PlayerID, isAdmin?: boolean): boolean {
  return getEditorPlayerIDs(isAdmin).includes(id);
}
