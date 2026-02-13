import { EndTurnActionResponse } from '@deities/apollo/ActionResponse.tsx';

export default function isFakeEndTurn({ current, next }: EndTurnActionResponse) {
  return current.player === next.player;
}
