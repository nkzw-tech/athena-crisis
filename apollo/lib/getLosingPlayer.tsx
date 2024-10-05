import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

export default function getLosingPlayer(
  map: MapData,
  actionResponse: ActionResponse,
): PlayerID | null {
  switch (actionResponse.type) {
    case 'AttackUnitGameOver':
    case 'PreviousTurnGameOver':
    case 'CaptureGameOver':
      return actionResponse.fromPlayer;
    case 'BeginTurnGameOver':
      return (
        actionResponse.fromPlayer ||
        /* Fallback for previous versions of `BeginTurnGameOver` */ map.currentPlayer
      );
  }
  return null;
}
