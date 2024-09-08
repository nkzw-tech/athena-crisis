import applyBeginTurnStatusEffects from '@deities/athena/lib/applyBeginTurnStatusEffects.tsx';
import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import getUnitsToHealOnBuildings from '@deities/athena/lib/getUnitsToHealOnBuildings.tsx';
import shouldRemoveUnit from '@deities/athena/lib/shouldRemoveUnit.tsx';
import subtractFuel from '@deities/athena/lib/subtractFuel.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import { HealAmount } from '@deities/athena/map/Configuration.tsx';
import {
  HumanPlayer,
  isHumanPlayer,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { EndTurnActionResponse } from '../ActionResponse.tsx';

export default function applyEndTurnActionResponse(
  map: MapData,
  { current, miss, next, rotatePlayers, round, supply }: EndTurnActionResponse,
): MapData {
  const nextPlayer = map
    .getPlayer(next.player)
    .setFunds(next.funds)
    .disableActiveSkills();

  let currentPlayer = map.getCurrentPlayer().setFunds(current.funds);
  if (miss) {
    currentPlayer = currentPlayer.copy({ misses: currentPlayer.misses + 1 });
  }

  let teams = updatePlayers(map.teams, [nextPlayer, currentPlayer]);
  const supplyVectors = new Set(supply);
  const unitsToHeal = getUnitsToHealOnBuildings(map, nextPlayer);
  const mapWithStatusEffects = applyBeginTurnStatusEffects(
    subtractFuel(map, nextPlayer),
    nextPlayer,
  );
  const destroyedUnits =
    map.units.size -
    mapWithStatusEffects.units.size +
    mapWithStatusEffects.units.reduce(
      (sum, unit, vector) =>
        sum +
        (!supplyVectors.has(vector) &&
        !unitsToHeal.has(vector) &&
        shouldRemoveUnit(map, vector, unit, nextPlayer.id)
          ? unit.count()
          : 0),
      0,
    );

  if (destroyedUnits > 0) {
    const mapB = map.copy({ teams });
    teams = updatePlayers(teams, [
      mapB
        .getPlayer(resolveDynamicPlayerID(map, 'opponent', nextPlayer.id))
        .modifyStatistics({
          destroyedUnits,
        }),
      mapB.getPlayer(nextPlayer.id).modifyStatistics({
        lostUnits: destroyedUnits,
      }),
    ]);
  }

  if (rotatePlayers && isHumanPlayer(currentPlayer)) {
    const temporaryMap = map.copy({ teams });
    teams = updatePlayers(teams, [
      createBotWithName(temporaryMap.getPlayer(current.player)).copy({
        teamId: currentPlayer.teamId,
      }),
      HumanPlayer.from(
        temporaryMap.getPlayer(next.player),
        currentPlayer.userId,
      ).copy({ teamId: nextPlayer.teamId }),
    ]);
  }

  return map
    .copy({
      currentPlayer: nextPlayer.id,
      round,
      teams,
      units: map.units.merge(
        unitsToHeal.map((unit) =>
          unit.refill().modifyHealth(HealAmount).removeStatusEffect(),
        ),
      ),
    })
    .recover(currentPlayer)
    .refill(nextPlayer, supply);
}
