import { EndTurnActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import applyBeginTurnStatusEffects, {
  isPoisoned,
} from '@deities/athena/lib/applyBeginTurnStatusEffects.tsx';
import getAllUnitsToRefill from '@deities/athena/lib/getAllUnitsToRefill.tsx';
import getUnitsByPositions from '@deities/athena/lib/getUnitsByPositions.tsx';
import getUnitsToHeal, {
  HealEntry,
} from '@deities/athena/lib/getUnitsToHeal.tsx';
import shouldRemoveUnit from '@deities/athena/lib/shouldRemoveUnit.tsx';
import subtractFuel from '@deities/athena/lib/subtractFuel.tsx';
import {
  Charge,
  HealAmount,
  MaxHealth,
} from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector, {
  sortByVectorKey,
  sortVectors,
} from '@deities/athena/map/Vector.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { fbt } from 'fbtee';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { Actions, State, StateToStateLike } from '../Types.tsx';
import animateHeal from './animateHeal.tsx';
import animatePoison from './animatePoison.tsx';
import animateSupply from './animateSupply.tsx';
import AnimationKey from './AnimationKey.tsx';
import explodeUnits from './explodeUnits.tsx';
import getTranslatedFactionName from './getTranslatedFactionName.tsx';
import isFakeEndTurn from './isFakeEndTurn.tsx';

const emptyUnitMap: ReadonlyMap<Vector, Unit> = new Map();
const emptyUnitHealMap: ReadonlyMap<Vector, HealEntry> = new Map();

const partitionUnitsToHeal = (
  units: ImmutableMap<Vector, HealEntry>,
): [
  unitsToHeal: ReadonlyMap<Vector, HealEntry>,
  unitsToSupply: ReadonlyMap<Vector, Unit>,
] => {
  const unitsToHeal = new Map<Vector, HealEntry>();
  const unitsToSupply = new Map<Vector, Unit>();
  for (const [vector, [unit, amount]] of units) {
    if (unit.health < MaxHealth) {
      unitsToHeal.set(vector, [unit, amount]);
    } else if (amount >= HealAmount) {
      unitsToSupply.set(vector, unit);
    }
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
  const isViewer = !isFake && state.currentViewer === nextPlayer;
  return {
    animations: state.animations.set(new AnimationKey(), {
      color: nextPlayer,
      length: 'short',
      onComplete: (state) => {
        requestFrame(async () => {
          const { map, vision } = state;
          const newMap = isFake
            ? map
            : applyBeginTurnStatusEffects(
                subtractFuel(map, nextPlayer),
                nextPlayer,
              );

          const complete = (state: State) => {
            const { map } = state;
            if (isViewer) {
              const player = map.maybeGetPlayer(nextPlayer);
              const availablePowerCount =
                (player
                  ? [...player.skills]
                      .map((skill) => {
                        const { charges } = getSkillConfig(skill);
                        return (
                          charges != null && charges * Charge <= player.charge
                        );
                      })
                      .filter(Boolean).length
                  : null) || 0;
              if (availablePowerCount > 0) {
                state = {
                  ...state,
                  animations: state.animations.set(new AnimationKey(), {
                    color: nextPlayer,
                    text: String(
                      fbt(
                        `A power is ready to be activated.`,
                        `A player's power is ready to be activated.`,
                      ),
                    ),
                    type: 'notice',
                  }),
                };
              }
            }

            return onComplete(state);
          };

          const [unitsToHeal, unitsToRefill] = isFake
            ? [emptyUnitHealMap, emptyUnitMap]
            : partitionUnitsToHeal(
                getUnitsToHeal(map, map.getPlayer(nextPlayer)).filter(
                  (_, vector) => vision.isVisible(map, vector),
                ),
              );

          const poisonedUnits = isFake
            ? emptyUnitMap
            : map.units.filter(
                (unit, vector) =>
                  !unitsToHeal.has(vector) &&
                  isPoisoned(map, nextPlayer, unit) &&
                  vision.isVisible(map, vector),
              );
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

          const removeUnits = (state: State) =>
            explodeUnits(
              actions,
              state,
              // Identify units that are out of fuel without applying the fuel adjustment, which is
              // applied later in `applyEndTurnActionResponse`.
              isFake
                ? []
                : sortVectors([
                    ...newMap.units
                      .filter(
                        (unit, vector) =>
                          !unitsToSupply.has(vector) &&
                          !unitsToHeal.has(vector) &&
                          vision.isVisible(map, vector) &&
                          shouldRemoveUnit(newMap, vector, unit, nextPlayer),
                      )
                      .keys(),
                  ]),
              complete,
            );

          const animatePoisonedUnits = (state: State) =>
            poisonedUnits.size
              ? animatePoison(
                  state,
                  sortByVectorKey(poisonedUnits),
                  removeUnits,
                )
              : removeUnits(state);

          await update(
            animateHeal(state, sortByVectorKey(unitsToHeal), (state) =>
              unitsToSupply.size
                ? animateSupply(
                    state,
                    sortByVectorKey(unitsToSupply),
                    animatePoisonedUnits,
                  )
                : animatePoisonedUnits(state),
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
              getTranslatedFactionName(state.playerDetails, nextPlayer),
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
