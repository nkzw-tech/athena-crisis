import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { fbt } from 'fbtee';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getUserDisplayName from '../lib/getUserDisplayName.tsx';
import { Actions, State } from '../Types.tsx';

export default async function receiveSkillSlotAnimation(
  { requestFrame, update }: Actions,
  state: State,
  actionResponse: ReceiveRewardActionResponse,
): Promise<State> {
  const { player } = actionResponse;
  const slot = actionResponse.reward.type === 'SkillSlot' ? actionResponse.reward.slot : null;

  if (!slot) {
    return state;
  }

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: player,
        direction: 'up',
        length: 'medium',
        onComplete: (state) => {
          requestFrame(() =>
            resolve({
              ...state,
              ...resetBehavior(),
            }),
          );
          return null;
        },
        padding: 'small',
        player,
        sound: 'UI/Start',
        style: 'flashy',
        text: String(
          fbt(
            fbt.param('user', getUserDisplayName(state.playerDetails, player)) +
              ' received a skill slot!',
            'Receive reward message',
          ),
        ),
        type: 'banner',
      }),
      map: applyActionResponse(state.map, state.vision, actionResponse),
      ...resetBehavior(NullBehavior),
    })),
  );
}
