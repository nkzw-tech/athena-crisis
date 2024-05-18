import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import { Bot } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import getColorName from './getColorName.tsx';
import nameGenerator from './nameGenerator.tsx';

const generateName = nameGenerator();

export default function mapWithAIPlayers(map: MapData) {
  return map.copy({
    teams: updatePlayers(
      map.teams,
      map.active
        .map((id) => map.getPlayer(id))
        .filter((player) => player.isPlaceholder())
        .map((player) =>
          Bot.from(player, `${getColorName(player.id)} ${generateName()}`),
        ),
    ),
  });
}
