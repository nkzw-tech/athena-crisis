import mergeTeams from '@deities/athena/lib/mergeTeams.tsx';
import { Teams } from '@deities/athena/map/Team.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { fbt } from 'fbt';
import { Actions, State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import getUnitDirection from './getUnitDirection.tsx';

export default function spawn(
  actions: Actions,
  state: State,
  unitsToSpawn: ReadonlyArray<[Vector, Unit]>,
  teams: Teams | null | undefined,
  onComplete: StateToStateLike,
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
  const hasNewPlayer = !state.map.getPlayer(unit) && team;
  const newTeam = hasNewPlayer
    ? team.copy({
        players: team.players.filter(({ id }) => id === unit.player),
      })
    : null;
  const newPlayer = newTeam?.players.get(unit.player);
  const name = newPlayer ? (newPlayer.isBot() ? newPlayer.name : null) : null;

  const animationKey = new AnimationKey();
  const animations = name
    ? state.animations.set(animationKey, {
        color: unit.player,
        text: String(
          fbt(
            `${fbt.param('name', name)} is invading!`,
            'user or bot is invading the game',
          ),
        ),
        type: 'notice',
      })
    : state.animations;

  return {
    animations: animations.set(position, {
      locked: false,
      onComplete: (state: State) => {
        if (!remainingUnits.length) {
          return onComplete(state);
        }
        actions.scheduleTimer(
          () =>
            actions.update((state) =>
              spawn(actions, state, remainingUnits, teams, onComplete),
            ),
          animationConfig.AnimationDuration,
        );
        return state;
      },
      onSpawn: ({ map }: State) => ({
        map: mergeTeams(
          map.copy({
            units: map.units.set(position, unit),
          }),
          newTeam ? ImmutableMap([[newTeam.id, newTeam]]) : undefined,
        ),
      }),
      type: 'spawn',
      unitDirection: getUnitDirection(state.map.getFirstPlayerID(), unit),
      variant: unit.player,
    }),
  };
}
