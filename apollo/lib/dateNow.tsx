let timeDifference = 0;

export const ONE_MINUTE = 1000 * 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;

export function setTime(serverTime: number) {
  // eslint-disable-next-line @deities/no-date-now
  timeDifference = serverTime - Date.now();
}

export default function dateNow() {
  // eslint-disable-next-line @deities/no-date-now
  return Date.now() + timeDifference;
}
