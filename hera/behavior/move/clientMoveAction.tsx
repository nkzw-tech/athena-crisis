import type { MoveActionResponse } from '@deities/apollo/ActionResponse.tsx';
import type { GameActionResponse } from '@deities/apollo/Types.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { RadiusItem } from '@deities/athena/Radius.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import type { Actions, State, StateLike } from '../../Types.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function clientMoveAction(
  { processGameActionResponse, update }: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  from: Vector,
  to: Vector,
  initialPath: ReadonlyArray<Vector> | null | undefined,
  fields: ReadonlyMap<Vector, RadiusItem>,
  state: State,
  onComplete: (
    state: State,
    actionResponse: MoveActionResponse,
  ) => StateLike | null,
  realPosition: Vector = from,
  partial?: boolean,
): StateLike {
  const { animations, map, vision } = state;
  const path = initialPath || getMovementPath(map, to, fields, vision).path;
  return {
    animations: addMoveAnimation(animations, {
      endSound: map.units.get(to) ? 'Unit/Load' : undefined,
      from,
      onComplete: (state) => {
        remoteAction.then(async (gameActionResponse) => {
          const actionResponse = gameActionResponse.self?.actionResponse;
          if (actionResponse?.type === 'Move') {
            update({
              ...onComplete(
                await processGameActionResponse(gameActionResponse),
                actionResponse,
              ),
              ...(gameActionResponse.others?.at(-1)?.actionResponse.type ===
              'GameEnd'
                ? {
                    behavior: new NullBehavior(),
                  }
                : null),
            });
          }
        });
        return {
          ...state,
          map: newMap,
        };
      },
      partial,
      path,
      realPosition,
      tiles: path.map((vector) => map.getTileInfo(vector)),
    }),
    behavior: new NullBehavior(),
    radius: null,
    selectedPosition: from,
    selectedUnit: map.units.get(from),
  };
}
