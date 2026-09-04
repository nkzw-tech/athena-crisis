import { CharacterMessageActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { resolveDynamicPlayerID } from '@deities/athena/map/Player.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import translateMessage from '../../i18n/translateMessage.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import { RadiusType } from '../../Radius.tsx';
import { Actions, State } from '../../Types.tsx';

export default function characterMessageAction(
  { requestFrame, update }: Actions,
  state: State,
  actionResponse: CharacterMessageActionResponse,
  messagePosition: 'top' | 'bottom',
): Promise<State> {
  const { map } = state;
  const { player: dynamicPlayer, silhouette, unitId, variant } = actionResponse;
  const player = resolveDynamicPlayerID(map, dynamicPlayer);
  const position =
    !silhouette &&
    map.units.findKey(
      (unit) =>
        unit.id === unitId && (player === 0 || unit.isLeader()) && map.matchesPlayer(unit, player),
    );

  return new Promise((resolve, reject) => {
    void update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        map,
        onComplete: (state) => {
          const newState = { ...state, highlightedPositions: null, radius: null };
          requestFrame(() => resolve(newState));
          return {
            highlightedPositions: null,
            radius: null,
          };
        },
        player,
        position: messagePosition,
        silhouette: silhouette ?? false,
        text: translateMessage(actionResponse),
        type: 'characterMessage',
        unitId,
        variant,
        viewer: state.currentViewer || undefined,
      }),
      highlightedPositions: position ? [position] : null,
      radius: position
        ? {
            fields: new Map([[position, RadiusItem(position)]]),
            focus: 'unit',
            path: null,
            type: RadiusType.Highlight,
          }
        : null,
    })).catch(reject);
  });
}
