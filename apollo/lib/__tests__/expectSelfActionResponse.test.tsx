import vec from '@deities/athena/map/vec.tsx';
import { expect, expectTypeOf, test } from 'vitest';
import { MoveActionResponse } from '../../ActionResponse.tsx';
import { GameActionResponse } from '../../Types.tsx';
import expectSelfActionResponse from '../expectSelfActionResponse.tsx';

const move = {
  from: vec(1, 1),
  fuel: 10,
  path: [vec(1, 2)],
  to: vec(1, 2),
  type: 'Move',
} as const;

test('returns and narrows the requested self action response', () => {
  const response = expectSelfActionResponse({ self: { actionResponse: move } }, 'Move');

  expect(response).toBe(move);
  expectTypeOf(response).toEqualTypeOf<MoveActionResponse>();
});

test('throws when the self action response is missing', () => {
  expect(() => expectSelfActionResponse({ self: null }, 'Move')).toThrow(
    "Expected self action response 'Move', received 'none'",
  );
});

test('throws when the self action response has the wrong type', () => {
  expect(() =>
    expectSelfActionResponse(
      {
        self: { actionResponse: { from: vec(1, 1), type: 'CompleteUnit' } },
      },
      'Move',
    ),
  ).toThrow("Expected self action response 'Move', received 'CompleteUnit'");
});

test('never treats a matching effect response as the requested response', () => {
  const response: GameActionResponse = {
    others: [{ actionResponse: move }],
    self: null,
  };

  expect(() => expectSelfActionResponse(response, 'Move')).toThrow(
    "Expected self action response 'Move', received 'none'",
  );
});
