import { SecretDiscoveredActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { OptionalObjectiveActionResponse } from '@deities/apollo/Objective.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { fbt } from 'fbt';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getCriteriaName from '../lib/getCriteriaName.tsx';
import { Actions, State } from '../Types.tsx';

export default async function objectiveAnimation(
  newMap: MapData,
  actions: Actions,
  state: State,
  actionResponse:
    | SecretDiscoveredActionResponse
    | OptionalObjectiveActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  const { map } = state;
  const { objective, type } = actionResponse;
  const isOptional = type === 'OptionalObjective';
  if (isOptional && objective.hidden) {
    return actions.update({ map: newMap });
  }

  const currentPlayer = state.map.getCurrentPlayer().id;
  const player = actionResponse.toPlayer || currentPlayer;
  const matchesTeam = map.matchesTeam(player, currentPlayer);
  const text = String(
    isOptional
      ? matchesTeam
        ? fbt(`Optional Objective Achieved!`, 'Optional objective banner')
        : fbt(`Optional Objective Failed!`, 'Optional objective banner')
      : matchesTeam
        ? fbt(`Secret Discovered!`, 'Secret discovered banner')
        : fbt(`Secret Denied!`, 'Secret discovered banner'),
  );
  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: player,
        length: 'medium',
        onComplete: (state) => ({
          ...state,
          animations: state.animations.set(new AnimationKey(), {
            color: player,
            length: 'medium',
            onComplete: (state) => {
              requestFrame(() => resolve({ ...state, map: newMap }));
              return state;
            },
            player,
            sound: 'UI/Start',
            style: 'flashy',
            text: String(getCriteriaName(objective.type)),
            type: 'banner',
          }),
          ...resetBehavior(NullBehavior),
        }),
        player,
        sound: 'UI/Start',
        text,
        type: 'banner',
      }),
      ...resetBehavior(NullBehavior),
    })),
  );
}
