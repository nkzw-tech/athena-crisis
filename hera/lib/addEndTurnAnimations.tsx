import { EndTurnActionResponse } from '@deities/apollo/ActionResponse.tsx';
import getAllUnitsToRefill from '@deities/athena/lib/getAllUnitsToRefill.tsx';
import getUnitsByPositions from '@deities/athena/lib/getUnitsByPositions.tsx';
import getUnitsToHealOnBuildings from '@deities/athena/lib/getUnitsToHealOnBuildings.tsx';
import shouldRemoveUnit from '@deities/athena/lib/shouldRemoveUnit.tsx';
import { MaxHealth } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector, {
  sortByVectorKey,
  sortVectors,
} from '@deities/athena/map/Vector.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { fbt } from 'fbt';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { Actions, State, StateToStateLike } from '../Types.tsx';
import animateHeal from './animateHeal.tsx';
import animateSupply from './animateSupply.tsx';
import AnimationKey from './AnimationKey.tsx';
import explodeUnits from './explodeUnits.tsx';
import getTranslatedFactionName from './getTranslatedFactionName.tsx';
import isFakeEndTurn from './isFakeEndTurn.tsx';

const emptyUnitMap: ReadonlyMap<Vector, Unit> = new Map();

const partitionUnitsToHeal = (units: ImmutableMap<Vector, Unit>) => {
  const unitsToHeal = new Map();
  const unitsToSupply = new Map();
  for (const [vector, unit] of units) {
    (unit.health < MaxHealth ? unitsToHeal : unitsToSupply).set(vector, unit);
  }
  return [unitsToHeal, unitsToSupply];
};

export default function addEndTurnAnimations(
  actions: Actions,
  actionResponse: EndTurnActionResponse,
  state: State,
  maybeExtraPositions:
    | Promise<ReadonlyArray<Vector> | null>
    | ReadonlyArray<Vector>
    | null,
  onComplete: StateToStateLike,
) {
  const { requestFrame, update } = actions;
  const {
    current: { player: currentPlayer },
    next: { player: nextPlayer },
    round,
  } = actionResponse;
  const isFake = isFakeEndTurn(actionResponse);
  return {
    animations: state.animations.set(new AnimationKey(), {
      color: nextPlayer,
      length: 'short',
      onComplete: (state) => {
        requestFrame(async () => {
          const { map, vision } = state;
          const newMap = map.subtractFuel(nextPlayer);
          const [unitsToHeal, unitsToRefill] = isFake
            ? [emptyUnitMap, emptyUnitMap]
            : partitionUnitsToHeal(getUnitsToHealOnBuildings(map, nextPlayer));

          const extraPositions = await maybeExtraPositions;
          const unitsToSupply = new Map([
            ...(isFake
              ? emptyUnitMap
              : getAllUnitsToRefill(
                  newMap,
                  vision,
                  state.map.getPlayer(nextPlayer),
                )),
            ...(extraPositions ? getUnitsByPositions(map, extraPositions) : []),
            ...unitsToRefill,
          ]);

          const explodeUnitsWithoutFuel = (state: State) =>
            explodeUnits(
              actions,
              state,
              // Identify units that are out of fuel without applying the fuel adjustment, which is
              // applied later in `applyEndTurnActionResponse`.
              sortVectors([
                ...newMap.units
                  .filter(
                    (unit, vector) =>
                      !unitsToSupply.has(vector) &&
                      !unitsToHeal.has(vector) &&
                      shouldRemoveUnit(newMap, vector, unit, nextPlayer),
                  )
                  .keys(),
              ]),
              onComplete,
            );

          await update(
            animateHeal(state, sortByVectorKey(unitsToHeal), (state) =>
              unitsToSupply.size
                ? animateSupply(
                    state,
                    sortByVectorKey(unitsToSupply),
                    explodeUnitsWithoutFuel,
                  )
                : explodeUnitsWithoutFuel(state),
            ),
          );
        });

        return state;
      },
      player: nextPlayer,
      sound: 'UI/Start',
      text: String(
        fbt(
          'Round ' +
            fbt.param('round', round) +
            ', ' +
            fbt.param(
              'color',
              getTranslatedFactionName(state.factionNames, nextPlayer),
            ),
          `The banner text for the beginning of a player's turn.`,
        ),
      ),
      type: 'banner',
    }),
    behavior: new NullBehavior(),
    map: isFake ? state.map : state.map.recover(currentPlayer),
  };
}
