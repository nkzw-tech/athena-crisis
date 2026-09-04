import { ActionResponse } from '../ActionResponse.tsx';
import { GameActionResponse } from '../Types.tsx';

export default function expectSelfActionResponse<ExpectedType extends ActionResponse['type']>(
  response: GameActionResponse,
  expectedType: ExpectedType,
): Extract<ActionResponse, { type: ExpectedType }> {
  const actionResponse = response.self?.actionResponse;
  if (actionResponse?.type !== expectedType) {
    throw new Error(
      `expectSelfActionResponse: Expected self action response '${expectedType}', received '${
        actionResponse?.type || 'none'
      }'. The client and server may be out of sync.`,
    );
  }

  return actionResponse as Extract<ActionResponse, { type: ExpectedType }>;
}
