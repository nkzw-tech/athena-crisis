import Player from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import { sortVectors } from '@deities/athena/map/Vector.tsx';
import { fbt } from 'fbtee';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { Actions, State, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import explodeUnits from './explodeUnits.tsx';
import getTranslatedFactionName from './getTranslatedFactionName.tsx';
import getUserDisplayName from './getUserDisplayName.tsx';

export default function addPlayerLoseAnimation(
  actions: Actions,
  state: State,
  player: Player,
  abandoned: boolean,
  onComplete: StateToStateLike,
) {
  return {
    animations: state.animations.set(new AnimationKey(), {
      color: player.id,
      length: 'medium',
      onComplete: (state) => {
        const { map } = state;
        const unitsToExplode = map.units
          .filter((unit: Unit) => map.matchesPlayer(unit, player))
          .keys();
        return {
          behavior: new NullBehavior(),
          ...explodeUnits(actions, state, sortVectors([...unitsToExplode]), onComplete),
        };
      },
      player: player.id,
      sound: null,
      text: String(
        abandoned
          ? fbt(
              fbt.param('user', getUserDisplayName(state.playerDetails, player.id)) +
                ' abandoned this game and disappeared!',
              'Player was defeated',
            )
          : fbt(
              fbt.param('color', getTranslatedFactionName(state.playerDetails, player.id)) +
                ' was defeated!',
              'Player was defeated',
            ),
      ),
      type: 'banner',
    }),
  };
}
