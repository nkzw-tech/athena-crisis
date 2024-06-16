import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function mapWithAIPlayers(map: MapData) {
  return map.copy({
    teams: updatePlayers(
      map.teams,
      map.active
        .map((id) => map.getPlayer(id))
        .filter((player) => player.isPlaceholder())
        .map(createBotWithName),
    ),
  });
}
