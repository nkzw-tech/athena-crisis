import { SecretDiscoveredActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { OptionalObjectiveActionResponse } from '@deities/apollo/Objective.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { fbt } from 'fbt';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getWinCriteriaName from '../lib/getWinCriteriaName.tsx';
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
  const { condition, type } = actionResponse;
  if (type === 'OptionalObjective' && condition.hidden) {
    return actions.update({ map: newMap });
  }

  const player = state.map.getCurrentPlayer().id;
  const text =
    type === 'SecretDiscovered'
      ? String(fbt(`Secret Discovered!`, 'Secret discovered banner'))
      : String(
          fbt(`Optional Objective Achieved!`, 'Optional objective banner'),
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
            text: String(getWinCriteriaName(condition.type)),
            type: 'banner',
          }),
          ...resetBehavior(),
          behavior: new NullBehavior(),
        }),
        player,
        sound: 'UI/Start',
        text,
        type: 'banner',
      }),
      ...resetBehavior(),
      behavior: new NullBehavior(),
    })),
  );
}
