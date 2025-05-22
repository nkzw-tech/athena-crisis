import { GameTimerValue } from '@deities/apollo/lib/GameTimerValue.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';

export default function getTranslatedTimerName(timer: GameTimerValue) {
  switch (timer) {
    case null:
      return <fbt desc="Label for a game with no timer">No Timer</fbt>;
    case -2:
      return <fbt desc="Label for realtime timer">Time Bank</fbt>;
    case -1:
      return <fbt desc="Label for realtime timer">Turn Timer</fbt>;
    case 86_400:
      return <fbt desc="Label for 1 day timer">1 Day</fbt>;
    case 345_600:
      return <fbt desc="Label for 4 days timer">4 Days</fbt>;
    case 604_800:
      return <fbt desc="Label for 1 week timer">1 Week</fbt>;
    default: {
      timer satisfies never;
      throw new UnknownTypeError('getTranslatedTimerName', timer);
    }
  }
}
