import getActivePlayers from '@deities/athena/lib/getActivePlayers.tsx';
import mergeTeams from '@deities/athena/lib/mergeTeams.tsx';
import { Teams } from '@deities/athena/map/Team.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { Actions, State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import getInvasionNoticeAnimation from './getInvasionNoticeAnimation.tsx';
import getUnitDirection from './getUnitDirection.tsx';
import getUserDisplayName from './getUserDisplayName.tsx';

export default function spawn(
  actions: Actions,
  state: State,
  unitsToSpawn: ReadonlyArray<readonly [Vector, Unit]>,
  teams: Teams | null | undefined,
  speed: 'fast' | 'slow',
  type: 'spawn' | 'despawn' = 'spawn',
  onComplete: StateToStateLike,
  isSubsequent = false,
): StateLike | null {
  const { animationConfig } = state;
  const [entry, ...remainingUnits] = unitsToSpawn;
  if (!entry) {
    return onComplete(state);
  }

  const [position, unit] = entry;
  const team = teams?.find(({ players }) =>
    players.some(({ id }) => id === unit.player),
  );
  const newTeam = team
    ? team.copy({
        players: team.players.filter(({ id }) => id === unit.player),
      })
    : null;
  const newPlayer = newTeam?.players.get(unit.player);
  const crystal = newPlayer?.isHumanPlayer() ? newPlayer.crystal : null;
  const name =
    (newPlayer?.isBot() && newPlayer.name) ||
    (newPlayer?.isHumanPlayer() &&
      getUserDisplayName(state.playerDetails, newPlayer.id)) ||
    null;

  const spawnUnit = (state: State) => ({
    animations: state.animations.set(position, {
      locked: false,
      onComplete: (state: State) => {
        if (!remainingUnits.length) {
          return onComplete(state);
        }
        actions.scheduleTimer(
          () =>
            actions.update((state) =>
              spawn(
                actions,
                state,
                remainingUnits,
                teams,
                speed,
                type,
                onComplete,
                true,
              ),
            ),
          animationConfig.ExplosionStep,
        );
        return state;
      },
      onSpawn:
        type === 'spawn'
          ? ({ map }: State) => {
              map = map.copy({
                units: map.units.set(position, unit),
              });

              if (!map.maybeGetPlayer(unit.player)) {
                map = mergeTeams(
                  map,
                  newTeam ? ImmutableMap([[newTeam.id, newTeam]]) : undefined,
                );
              }

              return {
                map: map.copy({
                  active: getActivePlayers(map, map.active),
                }),
              };
            }
          : undefined,
      speed,
      type,
      unitDirection: getUnitDirection(state.map.getFirstPlayerID(), unit),
      variant: unit.player,
    }),
  });

  return isSubsequent
    ? spawnUnit(state)
    : {
        animations: (name
          ? getInvasionNoticeAnimation(
              state.animations,
              state.playerDetails,
              unit.player,
              name,
              crystal,
            )
          : state.animations
        ).set(new AnimationKey(), {
          onComplete: spawnUnit,
          positions: [position],
          type: 'scrollIntoView',
        }),
      };
}
