const GameTimerValue = [null, -3, -2, -1, 86_400, 345_600, 604_800] as const;

export const FixedTimeTimer = -3;

export default GameTimerValue;

export type GameTimerValue = (typeof GameTimerValue)[number];

const timerSet = new Set(GameTimerValue);
export const PvPGameTimers = GameTimerValue.filter((timer) => timer !== FixedTimeTimer);
const pvpTimerSet: ReadonlySet<GameTimerValue> = new Set(PvPGameTimers);

export function validateTimer(timer: number | null | undefined): GameTimerValue {
  return timerSet.has(timer as GameTimerValue) ? (timer as GameTimerValue) : null;
}

export function isValidTimer(timer: number | null | undefined): timer is GameTimerValue {
  return !!timerSet.has(timer as GameTimerValue);
}

export function validatePvPTimer(timer: number | null | undefined): GameTimerValue {
  return pvpTimerSet.has(timer as GameTimerValue) ? (timer as GameTimerValue) : null;
}

export function isFixedTimeTimer(timer: number | null | undefined): timer is -3 {
  return timer === FixedTimeTimer;
}

export function isTimeBankTimer(timer: number | null | undefined): timer is -2 {
  return timer === -2;
}

export function isRealTime(timer: number | null | undefined): timer is -3 | -2 | -1 {
  return isFixedTimeTimer(timer) || timer === -1 || isTimeBankTimer(timer);
}
