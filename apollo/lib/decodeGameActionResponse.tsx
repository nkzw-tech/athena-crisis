import {
  decodeBuildings,
  decodeUnits,
} from '@deities/athena/map/Serialization.tsx';
import { decodeActionResponse } from '../EncodedActions.tsx';
import type {
  EncodedGameActionResponseWithError,
  GameActionResponse,
} from '../Types.tsx';

export default function decodeGameActionResponse(
  response: EncodedGameActionResponseWithError,
  detail?: unknown,
): GameActionResponse {
  if (!Array.isArray(response)) {
    if (response?.n === 'p') {
      return { others: [], self: null, timeout: null };
    }

    throw new Error(
      `Map: Error executing remote action.\n${detail ? `Detail: '${JSON.stringify(detail, null, 2)}'\n` : ``}Response: '${JSON.stringify(response, null, 2)}'`,
    );
  }

  const [self, others] = response;
  return {
    others:
      others &&
      others.map((otherResponse) => ({
        actionResponse: decodeActionResponse(otherResponse[0]),
        buildings: otherResponse[1] && decodeBuildings(otherResponse[1]),
        units: otherResponse[2] && decodeUnits(otherResponse[2]),
      })),
    self: self
      ? {
          actionResponse: decodeActionResponse(self[0]),
          buildings: self[1] && decodeBuildings(self[1]),
          units: self[2] && decodeUnits(self[2]),
        }
      : null,
    timeout: response[2] ?? undefined,
  };
}
