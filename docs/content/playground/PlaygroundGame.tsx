import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import { prepareSprites } from '@deities/art/Sprites.tsx';
import MapData from '@deities/athena/MapData.tsx';
import GameMap from '@deities/hera/GameMap.tsx';
import useClientGame from '@deities/hera/hooks/useClientGame.tsx';
import useClientGameAction from '@deities/hera/hooks/useClientGameAction.tsx';
import useClientGamePlayerDetails from '@deities/hera/hooks/useClientGamePlayerDetails.tsx';
import GameActions from '@deities/hera/ui/GameActions.tsx';
import DemoViewer from '@deities/hera/ui/lib/DemoViewer.tsx';
import MapInfo from '@deities/hera/ui/MapInfo.tsx';
import { UndoType } from '@deities/hermes/game/undo.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import { useInView } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

prepareSprites();

const startAction = {
  type: 'Start',
} as const;

export default function PlaygroundGame({
  map,
  metadata,
}: {
  map: MapData;
  metadata?: MapMetadata;
}) {
  const [renderKey, setRenderKey] = useState(0);
  const zoom = useScale();
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-20% 0px 6% 0px' });

  const [game, setGame, undo] = useClientGame(
    map,
    DemoViewer.id,
    metadata?.effects || new Map(),
    startAction,
  );
  const onAction = useClientGameAction(game, setGame);
  const playerDetails = useClientGamePlayerDetails(game.state, DemoViewer);
  const onUndo = useCallback(
    (type: UndoType) => {
      undo(type);
      setRenderKey((renderKey) => renderKey + 1);
    },
    [undo],
  );
  const fade = renderKey === 0;

  return (
    <div ref={ref}>
      <GameMap
        autoPanning
        currentUserId={DemoViewer.id}
        fogStyle="soft"
        key={`play-demo-map-${renderKey}`}
        lastActionResponse={game.lastAction}
        map={game.state}
        margin="minimal"
        onAction={onAction}
        pan
        paused={!isInView}
        playerDetails={playerDetails}
        scale={zoom}
        scroll={false}
        style="floating"
        tilted
      >
        {(props, actions) => {
          const hide = !isInView || props.lastActionResponse?.type === 'GameEnd';

          return (
            <>
              <MapInfo hide={hide} {...props} />
              <GameActions
                actions={actions}
                canUndoAction
                fade={fade}
                hide={hide}
                state={props}
                undo={onUndo}
                zoom={zoom}
              />
            </>
          );
        }}
      </GameMap>
    </div>
  );
}
