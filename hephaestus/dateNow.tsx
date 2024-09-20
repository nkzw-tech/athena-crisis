let timeDifference = 0;

export const ONE_HOUR = 1000 * 60 * 60;
export const ONE_DAY = ONE_HOUR * 24;

export function setTime(serverTime: number) {
  timeDifference = serverTime - dateNow();
}

export default function dateNow() {
  // eslint-disable-next-line @deities/no-date-now
  return Date.now() + timeDifference;
}
