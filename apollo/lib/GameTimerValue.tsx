const GameTimerValue = [null, -2, -1, 86_400, 345_600, 604_800] as const;

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

export function isTimeBankTimer(timer: number | null | undefined): timer is -2 {
  return timer === -2;
}

export function isRealTime(timer: number | null | undefined): timer is -2 | -1 {
  return timer === -1 || isTimeBankTimer(timer);
}
