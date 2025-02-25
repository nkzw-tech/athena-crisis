import { ActivatePowerActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import {
  getUnitsToDamage,
  onPowerUnitDamageEffect,
  onPowerUnitUpgrade,
} from '@deities/apollo/actions/applyPower.tsx';
import {
  getHealUnitTypes,
  getSkillPowerDamage,
  shouldUpgradeUnit,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import { HealEntry } from '@deities/athena/lib/getUnitsToHeal.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import {
  FastAnimationConfig,
  HealAmount,
  MaxHealth,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector, {
  sortByVectorKey,
  sortVectors,
} from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import animateHeal from '../../lib/animateHeal.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import damageUnits from '../../lib/damageUnits.tsx';
import getSkillConfigForDisplay from '../../lib/getSkillConfigForDisplay.tsx';
import sleep from '../../lib/sleep.tsx';
import spawn from '../../lib/spawn.tsx';
import upgradeUnits from '../../lib/upgradeUnits.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

const getUnitsToHealSkill = (
  map: MapData,
  player: PlayerID,
  skill: Skill,
): ImmutableMap<Vector, HealEntry> | null => {
  const healTypes = getHealUnitTypes(skill);
  return healTypes
    ? map.units
        .filter(
          (unit, vector) =>
            map.matchesPlayer(unit, player) &&
            unit.health < MaxHealth &&
            matchesActiveType(healTypes, unit, vector),
        )
        .map((unit) => [unit, HealAmount] as const)
    : null;
};

export default async function activatePowerAction(
  actions: Actions,
  state: State,
  actionResponse: ActivatePowerActionResponse,
): Promise<State> {
  const { requestFrame, scheduleTimer, scrollIntoView, update } = actions;
  const { from, skill, units: unitsToSpawn } = actionResponse;
  const { colors, name } = getSkillConfigForDisplay(skill);
  const player = state.map.getCurrentPlayer();

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: colors,
        length: 'medium',
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
                finalMap
                  .getPlayer(player.id)
                  .disableActiveSkills()
                  .activateSkill(skill),
              ),
              units: actionResponse.units
                ? state.map.units.merge(actionResponse.units)
                : state.map.units,
            })
            .getActiveUnitTypes()
            .get(player.id);

          const unitsToDamage = getUnitsToDamage(
            state.map,
            player,
            skill,
            from,
            vision,
          );
          const unitsToHeal = getUnitsToHealSkill(state.map, player.id, skill);
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
                      unit && onPowerUnitDamageEffect(skill, map, vector, unit);
                    return newMap ? { map: newMap } : null;
                  },
                )
            : null;

          const healUnits = unitsToHeal?.size
            ? (state: State) =>
                animateHeal(state, sortByVectorKey(unitsToHeal), next)
            : null;

          const shouldUpgradeFirst = skill === Skill.SpawnUnitInfernoJetpack;
          const unitsToUpgrade = (
            shouldUpgradeFirst ? state.map : finalMap
          ).units.filter(
            (unit, vector) =>
              !healVectors.has(vector) &&
              state.map.matchesPlayer(unit, player) &&
              matchesActiveType(unitTypes, unit, vector) &&
              shouldUpgradeUnit(unit, skill),
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
            ...(shouldUpgradeFirst
              ? [upgrade, spawnUnits]
              : [spawnUnits, upgrade]),
          ].filter(isPresent);

          const next = (state: State): StateLike | null => {
            const fn = queue.shift();
            if (fn) {
              return fn(state);
            }

            requestFrame(async () => {
              if (skill === Skill.HighTide) {
                await scrollIntoView([
                  vec(
                    Math.floor(state.map.size.width / 2),
                    Math.floor(state.map.size.height / 2),
                  ),
                ]);
                await update({
                  animations: state.animations.set(new AnimationKey(), {
                    type: 'shake',
                  }),
                });
                await sleep(scheduleTimer, FastAnimationConfig, 'long');
                await update({
                  animations: state.animations.set(new AnimationKey(), {
                    type: 'shake',
                  }),
                });
              }
              resolve({ ...state, map: finalMap, ...resetBehavior() });
            });
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
