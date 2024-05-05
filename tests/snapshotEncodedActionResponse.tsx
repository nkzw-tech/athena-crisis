import { decodeActionResponses } from '@deities/apollo/EncodedActions.tsx';
import { formatActionResponses } from '@deities/apollo/FormatActions.tsx';
import { EncodedGameActionResponse } from '@deities/apollo/Types.tsx';

export default function snapshotEncodedActionResponse(
  encodedGameActionResponse: EncodedGameActionResponse,
) {
  return encodedGameActionResponse[1]
    ? formatActionResponses(
        decodeActionResponses(
          encodedGameActionResponse[1].map(
            ([actionResponse]) => actionResponse,
          ),
        ),
        {
          colors: false,
        },
      ).join('\n')
    : '';
}
