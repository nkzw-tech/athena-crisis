import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import { AllowedMisses } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

export default function timeoutActionResponseMutator(map: MapData, actionResponse: ActionResponse) {
  if (actionResponse.type === 'EndTurn') {
    const player = map.getCurrentPlayer();
    if (
      player.misses >= AllowedMisses - 1 &&
      player.isHumanPlayer() &&
      player.crystal === Crystal.Command
    ) {
      return {
        fromPlayer: player.id,
        name: createBotWithName(player).name,
        type: 'AbandonInvasion',
      } as const;
    }

    return { ...actionResponse, miss: true };
  }
  return actionResponse;
}
