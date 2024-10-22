import applyBeginTurnStatusEffects from '@deities/athena/lib/applyBeginTurnStatusEffects.tsx';
import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import getUnitsToHeal from '@deities/athena/lib/getUnitsToHeal.tsx';
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
  const unitsToHeal = getUnitsToHeal(map, nextPlayer);
  const supplyVectors = new Set([
    ...(supply || []),
    ...unitsToHeal.filter(([, amount]) => amount >= HealAmount).keys(),
  ]);
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
        unitsToHeal.map(([unit, amount]) => {
          unit = unit.modifyHealth(amount).removeStatusEffect();
          return amount >= HealAmount ? unit.refill() : unit;
        }),
      ),
    })
    .recover(currentPlayer)
    .refill(nextPlayer, supplyVectors);
}
