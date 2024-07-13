import { PlayerID } from '../map/Player.tsx';
import MapData from '../MapData.tsx';
import { Criteria, Objective } from '../Objectives.tsx';

const isBonusObjective = (
  player: PlayerID,
  objective: Objective,
): objective is Objective & { completed?: Set<PlayerID> } =>
  !!(
    objective.type !== Criteria.Default &&
    objective.optional &&
    (!objective.players?.length || objective.players.includes(player))
  );

export default function hasBonusObjective(map: MapData, player: PlayerID) {
  return map.config.objectives.some(isBonusObjective.bind(null, player));
}

export function achievedOneBonusObjective(map: MapData, player: PlayerID) {
  return map.config.objectives.some(
    (objective) =>
      isBonusObjective(player, objective) && !!objective.completed?.has(player),
  );
}
