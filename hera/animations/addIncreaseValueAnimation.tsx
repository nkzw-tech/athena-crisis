import {
  IncreaseChargeActionResponse,
  IncreaseFundsActionResponse,
} from '@deities/apollo/ActionResponse.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { fbt } from 'fbt';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import { Actions, State } from '../Types.tsx';

export default async function addIncreaseValueAnimation(
  actions: Actions,
  newMap: MapData,
  actionResponse: IncreaseChargeActionResponse | IncreaseFundsActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  const { player } = actionResponse;
  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: player,
        length: 'short',
        onComplete: (state) => {
          requestFrame(() => resolve({ ...state, map: newMap }));
          return state;
        },
        player,
        sound: 'UI/Start',
        text:
          actionResponse.type === 'IncreaseCharge'
            ? fbt(
                fbt.param(
                  'player',
                  getTranslatedFactionName(state.playerDetails, player),
                ) +
                  ' received ' +
                  fbt.plural('one charge', actionResponse.charges, {
                    many: 'charges',
                    showCount: 'ifMany',
                  }) +
                  '!',
                'Charge increased message',
              )
            : fbt(
                fbt.param(
                  'player',
                  getTranslatedFactionName(state.playerDetails, player),
                ) +
                  ' received ' +
                  fbt.plural('fund', actionResponse.funds, {
                    many: 'funds',
                    showCount: 'yes',
                  }) +
                  '!',
                'Charge increased message',
              ),
        type: 'banner',
      }),
      map: newMap,
      ...resetBehavior(NullBehavior),
    })),
  );
}
