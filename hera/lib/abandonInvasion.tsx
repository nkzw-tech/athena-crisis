import { fbt } from 'fbtee';
import { State, StateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import getUserDisplayName from './getUserDisplayName.tsx';

export default function abandonInvasion(
  state: State,
  name: string,
): StateLike | null {
  const player = state.map.getCurrentPlayer();
  return {
    animations: state.animations.set(new AnimationKey(), {
      color: player.id,
      text: String(
        fbt(
          `${fbt.param('name', getUserDisplayName(state.playerDetails, player.id))} abandoned this game and disappeared. ${fbt.param('botName', name)} is taking over!`,
          'User or bot is abandoning the game',
        ),
      ),
      type: 'notice',
    }),
  };
}
