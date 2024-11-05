import { executeEffect } from '@deities/apollo/Action.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import { isHumanPlayer } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import pickItem from '@deities/hephaestus/pickItem.tsx';
import ActivatePowerMessages from './ActivatePowerMessages.tsx';

export default function getActivatePowerMessage(
  previousMap: MapData,
  currentMap: MapData,
  vision: VisionT,
  skill: Skill,
) {
  const messages =
    ActivatePowerMessages.get(skill) || ActivatePowerMessages.get(-1);

  if (!messages) {
    return null;
  }

  const currentPlayer = previousMap.getCurrentPlayer();
  const activeUnitTypes = previousMap
    .copy({
      teams: updatePlayer(
        previousMap.teams,
        currentPlayer.activateSkill(skill),
      ),
    })
    .getActiveUnitTypes()
    .get(currentPlayer.id);

  const units = new Set<number>();
  for (const [vector, unit] of previousMap.units) {
    if (
      previousMap.matchesPlayer(unit, previousMap.currentPlayer) &&
      (!activeUnitTypes || matchesActiveType(activeUnitTypes, unit, vector))
    ) {
      units.add(unit.id);
    }
  }

  const maybeHumanPlayer = isHumanPlayer(currentPlayer) ? currentPlayer : null;
  const filteredMessages = (
    skill === Skill.SpawnUnitInfernoJetpack
      ? messages
      : messages.filter(([message]) => units.has(message.unitId))
  ).filter(
    ([, , userIds]) =>
      !userIds || (maybeHumanPlayer && userIds.has(maybeHumanPlayer.userId)),
  );

  const message = pickItem(filteredMessages);
  return message ? executeEffect(currentMap, vision, message) : null;
}
