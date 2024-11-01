import { executeEffect } from '@deities/apollo/Action.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { isHumanPlayer } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import pickItem from '@deities/hephaestus/pickItem.tsx';
import ActivatePowerMessages from './ActivatePowerMessages.tsx';

export default function getActivatePowerMessage(
  previousMap: MapData,
  currentMap: MapData,
  vision: VisionT,
  skill: -1 | Skill,
) {
  const messages = ActivatePowerMessages.get(skill);
  if (!messages) {
    return null;
  }

  const units = new Set<number>();
  for (const [, unit] of previousMap.units) {
    if (previousMap.matchesPlayer(unit, previousMap.currentPlayer)) {
      units.add(unit.id);
    }
  }

  const currentPlayer = previousMap.getCurrentPlayer();
  const maybeHumanPlayer = isHumanPlayer(currentPlayer) ? currentPlayer : null;
  const message = pickItem(
    (skill === Skill.SpawnUnitInfernoJetpack
      ? messages
      : messages.filter(([message]) => units.has(message.unitId))
    ).filter(
      ([, , userIds]) =>
        !userIds || (maybeHumanPlayer && userIds.has(maybeHumanPlayer.userId)),
    ),
  );
  return message ? executeEffect(currentMap, vision, message) : null;
}
