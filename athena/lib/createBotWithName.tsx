import Player, { Bot } from '../map/Player.tsx';
import getColorName from './getColorName.tsx';
import nameGenerator from './nameGenerator.tsx';

const generateName = nameGenerator();

export default function createBotWithName(player: Player) {
  return Bot.from(player, `${getColorName(player.id)} ${generateName()}`);
}
