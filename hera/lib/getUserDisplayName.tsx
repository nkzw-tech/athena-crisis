import { PlayerID } from '@deities/athena/map/Player.tsx';
import { fbt } from 'fbtee';
import { PlayerDetails } from '../Types.tsx';

export default function getUserDisplayName(
  playerDetails: PlayerDetails,
  player: PlayerID | null,
) {
  return (
    (player != null && playerDetails.get(player)?.displayName) ||
    (playerDetails.size >= 1 &&
      playerDetails.values().next().value!.displayName) ||
    String(fbt('Player', 'Placeholder user name'))
  );
}
