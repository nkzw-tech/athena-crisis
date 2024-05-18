import type { PlayerID, PlayerIDs } from '../map/Player.tsx';

export default function matchesPlayerList(
  players: PlayerIDs | undefined,
  player: PlayerID,
) {
  return !players?.length || players.includes(player);
}
