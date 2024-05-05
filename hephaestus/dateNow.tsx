let timeDifference = 0;

export const ONE_DAY = 1000 * 60 * 60 * 24;

export function setTime(serverTime: number) {
  timeDifference = serverTime - dateNow();
}

export default function dateNow() {
  // eslint-disable-next-line @deities/no-date-now
  return Date.now() + timeDifference;
}
