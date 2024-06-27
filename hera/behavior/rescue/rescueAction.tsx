import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import getUnitDirection from '../../lib/getUnitDirection.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function rescueAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  actionResponse: ActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  if (actionResponse.type !== 'Rescue') {
    return update(null);
  }

  const { player, to: position } = actionResponse;
  return new Promise((resolve) => {
    update((state) => {
      const unitB = state.map.units.get(position);
      return unitB
        ? {
            animations: state.animations.set(position, {
              onComplete: () => {
                requestFrame(async () =>
                  resolve(await handleRemoteAction(actions, remoteAction)),
                );

                return {
                  map: newMap,
                };
              },
              onRescue: unitB.isBeingRescuedBy(player)
                ? (state: State) => ({
                    ...state,
                    map: state.map.copy({
                      units: state.map.units.set(
                        position,
                        state.map.units.get(position)!.setPlayer(player),
                      ),
                    }),
                  })
                : undefined,
              type: 'rescue',
              unitDirection: getUnitDirection(newMap.getFirstPlayerID(), unitB),
              variant: player,
            }),
            ...resetBehavior(NullBehavior),
          }
        : null;
    });
  });
}
