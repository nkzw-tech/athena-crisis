export function gameRoom(gameId: number) {
  return `/game/${gameId}`;
}

export function pendingGameRoom(pendingGameId: number) {
  return `/pending-game/${pendingGameId}`;
}
