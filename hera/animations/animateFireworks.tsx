import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { State, StateLike, StateToStateLike } from '../Types.tsx';

export default function animateFireworks(
  state: State,
  positions: ReadonlyArray<Vector>,
  onComplete: StateToStateLike,
): StateLike | null {
  const position = positions?.[0];
  return position
    ? {
        animations: state.animations.set(position, {
          onComplete: (state: StateLike) =>
            animateFireworks(
              {
                ...state,
                animations: state.animations!.delete(position),
              } as State,
              positions.slice(1),
              onComplete,
            ),
          type: 'fireworks',
        }),
      }
    : onComplete(state);
}

export function getPossibleFireworksPositions(map: MapData, player: PlayerID) {
  const possiblePositions = new Set<Vector>();
  for (const [vector, building] of map.buildings) {
    if (map.matchesTeam(building, player)) {
      possiblePositions.add(vector);
    }
  }
  for (const [vector, unit] of map.units) {
    if (map.matchesTeam(unit, player)) {
      possiblePositions.add(vector);
    }
  }
  return possiblePositions;
}
