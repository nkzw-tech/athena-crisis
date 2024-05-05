import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { formatActionResponse } from '@deities/apollo/FormatActions.tsx';
import chalk from 'chalk';
import terminalImage from 'term-img';
import type { Image } from './screenshot.tsx';

export function printGameState(
  actionResponse: ActionResponse | string,
  screenshot: Image,
) {
  console.log(
    typeof actionResponse === 'string'
      ? chalk.bold(actionResponse)
      : formatActionResponse(actionResponse),
    '\n',
    terminalImage(screenshot, { fallback: () => '' }),
    '\n',
  );
}
