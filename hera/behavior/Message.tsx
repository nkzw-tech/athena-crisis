import Vector from '@deities/athena/map/Vector.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { getMessagePlayer } from '../message/MapMessageContainer.tsx';
import MessageTile from '../MessageTile.tsx';
import Tick from '../Tick.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';

export function canPlaceMessage(
  { map, messages, vision }: State,
  vector: Vector | null,
): vector is Vector {
  return !!(vector && vision.isVisible(map, vector) && !messages.has(vector));
}

export default class Message {
  public readonly type = 'message' as const;

  deactivate(actions: Actions | null): StateLike | null {
    if (actions) {
      requestAnimationFrame(async () => {
        await actions.resumeReplay();
      });
    }
    return {
      selectedMessagePosition: null,
    };
  }

  select(vector: Vector, state: State): StateLike | null {
    if (
      canPlaceMessage(state, vector) &&
      state.selectedMessagePosition !== vector
    ) {
      AudioPlayer.playSound('UI/Put');

      return {
        selectedMessagePosition: vector,
      };
    }
    return null;
  }

  component = ({ state }: StateWithActions) => {
    const {
      animationConfig,
      currentUser,
      currentViewer,
      map,
      playerDetails,
      position,
      selectedMessagePosition,
      tileSize,
      zIndex,
    } = state;

    const vector = selectedMessagePosition || position;
    return canPlaceMessage(state, vector) ? (
      <Tick animationConfig={animationConfig}>
        <MessageTile
          absolute
          distance={0}
          highlight
          key={String(vector)}
          player={
            currentUser
              ? getMessagePlayer(currentUser, currentViewer, playerDetails)
              : currentViewer || map.getFirstPlayerID()
          }
          position={vector}
          press={!!selectedMessagePosition}
          pulse
          size={tileSize}
          zIndex={zIndex}
        />
      </Tick>
    ) : null;
  };
}
