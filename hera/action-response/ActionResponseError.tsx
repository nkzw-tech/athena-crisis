import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default class ActionResponseError extends Error {
  constructor(
    message: string,
    public readonly actionResponse: ActionResponse,
    public readonly map: MapData,
  ) {
    super(
      `${message}\nAction Response: ${JSON.stringify(
        actionResponse,
        null,
        2,
      )}\nMap: ${JSON.stringify(map, null, 2)}`,
    );
  }
}
