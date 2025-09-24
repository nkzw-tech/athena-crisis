import { ActivateCrystalActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { fbt } from 'fbtee';
import AnimationKey from '../../lib/AnimationKey.tsx';
import { Actions, State } from '../../Types.tsx';
import activateCrystalAction from './activateCrystalAction.tsx';

export default async function clientActivateCrystalAction(
  actions: Actions,
  actionResponse: ActivateCrystalActionResponse,
): Promise<State> {
  const { update } = actions;

  let state = await update(null);
  const playerDetails = state.playerDetails.get(state.map.currentPlayer);
  const shouldShowMessage =
    !!playerDetails &&
    'redStars' in playerDetails &&
    playerDetails.redStars === 0;

  if (shouldShowMessage && actionResponse.crystal === Crystal.Power) {
    state = await update({
      animations: state.animations.set(new AnimationKey(), {
        color: state.map.currentPlayer,
        text: String(
          fbt(
            `This battle is now timed. If you take too long or go offline, you'll lose automatically!`,
            `A power activation means the battle is now timed.`,
          ),
        ),
        type: 'notice',
      }),
    });
  }

  return await update(await activateCrystalAction(actions, actionResponse));
}
