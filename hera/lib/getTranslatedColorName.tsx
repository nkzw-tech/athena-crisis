import { PlayerID } from '@deities/athena/map/Player.tsx';
import { playerToColor } from '@deities/ui/getColor.tsx';
import { fbt } from 'fbt';

const capitalizedColor = (player: PlayerID) => {
  const color = playerToColor(player);
  return color.slice(0, 1).toUpperCase() + color.slice(1);
};

export default function getTranslatedColorName(player: PlayerID) {
  return String(
    fbt(
      fbt.enum(capitalizedColor(player), [
        'Blue',
        'Cyan',
        'Green',
        'Neutral',
        'Orange',
        'Pink',
        'Purple',
        'Red',
      ]),
      'Enum for color names',
    ),
  );
}
