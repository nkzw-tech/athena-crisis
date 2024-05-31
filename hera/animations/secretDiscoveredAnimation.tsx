import { SecretDiscoveredActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { OptionalObjectiveActionResponse } from '@deities/apollo/Objective.tsx';
import { fbt } from 'fbt';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getWinCriteriaName from '../lib/getWinCriteriaName.tsx';
import { Actions, State } from '../Types.tsx';

export default async function secretDiscoveredAnimation(
  actions: Actions,
  state: State,
  actionResponse:
    | SecretDiscoveredActionResponse
    | OptionalObjectiveActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  const { condition, type } = actionResponse;
  const player = state.map.getCurrentPlayer().id;
  const text =
    type === 'SecretDiscovered'
      ? String(fbt(`Secret Discovered!`, 'Secret discovered banner'))
      : !condition.hidden
        ? String(
            fbt(`Optional Objective fulfilled!`, 'Optional objective banner'),
          )
        : String(
            fbt(
              `Optional Secret Discovered!`,
              'Secret Optional objective banner',
            ),
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
              requestFrame(() => resolve(state));
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
