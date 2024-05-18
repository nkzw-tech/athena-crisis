import type { EncodedActionResponse } from '../EncodedActions.tsx';
import { decodeActionResponse } from '../EncodedActions.tsx';

export default function maybeDecodeActionResponse(
  lastAction: string | EncodedActionResponse | null | undefined,
) {
  if (lastAction) {
    try {
      return decodeActionResponse(
        typeof lastAction === 'string' ? JSON.parse(lastAction) : lastAction,
      );
    } catch {
      return { type: 'Start' } as const;
    }
  }
  return null;
}
