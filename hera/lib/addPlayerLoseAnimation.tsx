import { CaptureGameOverActionResponse } from '@deities/apollo/Objective.tsx';
import Player from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import { sortVectors } from '@deities/athena/map/Vector.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { Actions, State, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import explodeUnits from './explodeUnits.tsx';
import getPlayerDefeatedMessage from './getPlayerDefeatedMessage.tsx';

export default function addPlayerLoseAnimation(
  actions: Actions,
  actionResponse: CaptureGameOverActionResponse,
  state: State,
  player: Player,
  onComplete: StateToStateLike,
) {
  return {
    animations: state.animations.set(new AnimationKey(), {
      color: actionResponse.fromPlayer,
      length: 'short',
      onComplete: (state) => {
        const { map } = state;
        const unitsToExplode = map.units
          .filter((unit: Unit) => map.matchesPlayer(unit, player))
          .keys();
        return {
          behavior: new NullBehavior(),
          ...explodeUnits(
            actions,
            state,
            sortVectors([...unitsToExplode]),
            onComplete,
          ),
        };
      },
      player: actionResponse.fromPlayer,
      sound: null,
      text: getPlayerDefeatedMessage(
        state.factionNames,
        actionResponse.fromPlayer,
      ),
      type: 'banner',
    }),
  };
}
