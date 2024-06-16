import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import getUnitsToHealOnBuildings from '@deities/athena/lib/getUnitsToHealOnBuildings.tsx';
import shouldRemoveUnit from '@deities/athena/lib/shouldRemoveUnit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
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
  const destroyedUnits = map
    .subtractFuel(nextPlayer.id)
    .units.filter(
      (unit, vector) =>
        !supplyVectors.has(vector) &&
        shouldRemoveUnit(map, vector, unit, nextPlayer.id),
    ).size;

  if (destroyedUnits > 0) {
    teams = updatePlayer(
      teams,
      map
        .copy({ teams })
        .getPlayer(resolveDynamicPlayerID(map, 'opponent', nextPlayer.id))
        .modifyStatistics({
          destroyedUnits,
        }),
    );
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
        getUnitsToHealOnBuildings(map, nextPlayer).map((unit) =>
          unit.refill().modifyHealth(HealAmount),
        ),
      ),
    })
    .recover(currentPlayer)
    .refill(nextPlayer, supply);
}
