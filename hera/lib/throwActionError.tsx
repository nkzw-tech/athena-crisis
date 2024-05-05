import { Action } from '@deities/apollo/Action.tsx';

export default function throwActionError(action: Action): never {
  throw new Error(
    `Failed to execute action '${JSON.stringify(action).replaceAll(
      '\n',
      '',
    )}'.`,
  );
}
