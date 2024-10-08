import { ActivatePowerActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import {
  getUnitsToDamage,
  onPowerUnitOpponentEffect,
  onPowerUnitUpgrade,
} from '@deities/apollo/actions/applyPower.tsx';
import {
  getHealUnitTypes,
  getSkillPowerDamage,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { MaxHealth } from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import { sortByVectorKey, sortVectors } from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import animateHeal from '../../lib/animateHeal.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import damageUnits from '../../lib/damageUnits.tsx';
import getSkillConfigForDisplay from '../../lib/getSkillConfigForDisplay.tsx';
import spawn from '../../lib/spawn.tsx';
import upgradeUnits from '../../lib/upgradeUnits.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

const getUnitsToHeal = (map: MapData, player: PlayerID, skill: Skill) => {
  const healTypes = getHealUnitTypes(skill);
  return healTypes
    ? map.units.filter(
        (unit, vector) =>
          map.matchesPlayer(unit, player) &&
          unit.health < MaxHealth &&
          matchesActiveType(healTypes, unit, vector),
      )
    : null;
};

export default async function activatePowerAction(
  actions: Actions,
  state: State,
  actionResponse: ActivatePowerActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  const { skill, units: unitsToSpawn } = actionResponse;
  const { colors, name } = getSkillConfigForDisplay(skill);
  const player = state.map.getCurrentPlayer();

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: colors,
        length: 'long',
        onComplete: (state) => {
          const { vision } = state;
          const finalMap = applyActionResponse(
            state.map,
            vision,
            actionResponse,
          );

          const unitTypes = state.map
            .copy({
              teams: updatePlayer(
                state.map.teams,
                finalMap.getPlayer(player.id),
              ),
            })
            .getActiveUnitTypes()
            .get(player.id);

          const unitsToDamage = getUnitsToDamage(
            state.map,
            player,
            skill,
            vision,
          );
          const unitsToHeal = getUnitsToHeal(state.map, player.id, skill);
          const healVectors = new Set(
            unitsToHeal ? [...unitsToHeal.keys()] : [],
          );

          const damage = unitsToDamage?.size
            ? (state: State) =>
                damageUnits(
                  actions,
                  state,
                  skill === Skill.BuyUnitDragon ? 'fire' : 'power',
                  getSkillPowerDamage(skill),
                  sortByVectorKey(unitsToDamage),
                  next,
                  ({ map }, vector) => {
                    const unit = map.units.get(vector);
                    const newMap =
                      unit &&
                      onPowerUnitOpponentEffect(skill, map, vector, unit);
                    return newMap ? { map: newMap } : null;
                  },
                )
            : null;

          const healUnits = unitsToHeal?.size
            ? (state: State) =>
                animateHeal(state, sortByVectorKey(unitsToHeal), next)
            : null;

          const unitsToUpgrade = state.map.units.filter(
            (unit, vector) =>
              !healVectors.has(vector) &&
              (!unit.isCompleted() ||
                skill === Skill.RecoverAirUnits ||
                skill === Skill.SpawnUnitInfernoJetpack ||
                skill === Skill.UnlockZombie) &&
              state.map.matchesPlayer(unit, player) &&
              matchesActiveType(unitTypes, unit, vector),
          );

          const spawnUnits = unitsToSpawn?.size
            ? (state: State) =>
                spawn(actions, state, [...unitsToSpawn], null, 'slow', next)
            : null;

          const upgrade = unitsToUpgrade.size
            ? (state: State) =>
                upgradeUnits(
                  actions,
                  state,
                  sortVectors([...unitsToUpgrade.keys()]),
                  next,
                  ({ map }, vector) => {
                    const unit = map.units.get(vector);
                    const newUnit = unit && onPowerUnitUpgrade(skill, unit);
                    return newUnit
                      ? {
                          map: map.copy({
                            units: map.units.set(vector, newUnit),
                          }),
                        }
                      : null;
                  },
                )
            : null;

          const queue = [
            damage,
            healUnits,
            ...(skill === Skill.SpawnUnitInfernoJetpack
              ? [upgrade, spawnUnits]
              : [spawnUnits, upgrade]),
          ].filter(isPresent);

          const next = (state: State): StateLike | null => {
            const fn = queue.shift();
            if (fn) {
              return fn(state);
            }

            requestFrame(() =>
              resolve({ ...state, map: finalMap, ...resetBehavior() }),
            );
            return null;
          };

          return {
            ...next(state),
            map: state.map.copy({
              teams: updatePlayer(
                state.map.teams,
                state.map
                  .getPlayer(player.id)
                  .setCharge(finalMap.getPlayer(player.id).charge)
                  .activateSkill(skill),
              ),
            }),
          };
        },
        player: player.id,
        sound: 'UI/Start',
        style: 'flashy',
        text: String(name),
        type: 'banner',
      }),
      ...resetBehavior(NullBehavior),
    })),
  );
}
