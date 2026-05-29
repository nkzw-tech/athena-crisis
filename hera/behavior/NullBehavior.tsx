import Vector from '@deities/athena/map/Vector.tsx';
import { State } from '../Types.tsx';

export default class NullBehavior {
  public readonly type = 'null' as const;

  activate() {
    return {
      showCursor: false,
    };
  }

  enter(vector: Vector, state: State) {
    const { highlightedPositions, map, messages, preventRemoteActions, vision } = state;
    if (!preventRemoteActions && messages.has(vector) && vision.isVisible(map, vector)) {
      return {
        highlightedPositions: [vector],
      };
    } else if (highlightedPositions?.length) {
      return {
        highlightedPositions: null,
      };
    }

    return null;
  }

  deactivate() {
    return {
      showCursor: true,
    };
  }
}
