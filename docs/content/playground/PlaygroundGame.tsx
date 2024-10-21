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
import useScale from '@deities/ui/hooks/useScale.tsx';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

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
  const zoom = useScale();
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-20% 0px 6% 0px' });

  const [game, setGame] = useClientGame(
    map,
    DemoViewer.id,
    metadata?.effects || new Map(),
    startAction,
  );
  const onAction = useClientGameAction(game, setGame);
  const playerDetails = useClientGamePlayerDetails(game.state, DemoViewer);

  return (
    <div ref={ref}>
      <GameMap
        currentUserId={DemoViewer.id}
        fogStyle="soft"
        key="play-demo-map"
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
          const hide =
            !isInView || props.lastActionResponse?.type === 'GameEnd';

          return (
            <>
              <MapInfo hide={hide} {...props} />
              <GameActions
                actions={actions}
                hide={hide}
                state={props}
                zoom={zoom}
              />
            </>
          );
        }}
      </GameMap>
    </div>
  );
}
