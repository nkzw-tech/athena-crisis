import { Action } from '@deities/apollo/Action.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default class ActionError extends Error {
  constructor(
    public readonly action: Action,
    public readonly map: MapData,
  ) {
    super(
      `Map: Error executing '${action.type}'.\nAction: '${JSON.stringify(action)}'\nMap: '${JSON.stringify(map)}'`,
    );
  }
}
