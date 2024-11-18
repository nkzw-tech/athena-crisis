const GameTimerValue = [null, -1, 86_400, 345_600, 604_800] as const;

export default GameTimerValue;

export type GameTimerValue = (typeof GameTimerValue)[number];

const timerSet = new Set(GameTimerValue);

export function validateTimer(
  timer: number | null | undefined,
): GameTimerValue {
  return timerSet.has(timer as GameTimerValue)
    ? (timer as GameTimerValue)
    : null;
}

export function isValidTimer(
  timer: number | null | undefined,
): timer is GameTimerValue {
  return !!timerSet.has(timer as GameTimerValue);
}

export const isRealTime = (timer: number | null | undefined) => timer === -1;
