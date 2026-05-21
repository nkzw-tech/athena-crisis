import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { formatActionResponse } from '@deities/apollo/FormatActions.tsx';
import chalk from 'chalk';
import type { Image } from './screenshot.tsx';
import terminalImage from './terminalImage.tsx';

export function printGameState(actionResponse: ActionResponse | string, screenshot: Image) {
  // eslint-disable-next-line no-console
  console.log(
    typeof actionResponse === 'string'
      ? chalk.bold(actionResponse)
      : formatActionResponse(actionResponse),
    '\n',
    terminalImage(screenshot),
    '\n',
  );
}
