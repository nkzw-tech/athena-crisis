import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import { prepareSprites } from '@deities/art/Sprites.tsx';
import MapData from '@deities/athena/MapData.tsx';
import GameMap from '@deities/hera/GameMap.tsx';
import useClientGame from '@deities/hera/hooks/useClientGame.tsx';
import useClientGameAction from '@deities/hera/hooks/useClientGameAction.tsx';
import GameActions from '@deities/hera/ui/GameActions.tsx';
import MapInfo from '@deities/hera/ui/MapInfo.tsx';
import setupGamePad from '@deities/ui/controls/setupGamePad.tsx';
import setupKeyboard from '@deities/ui/controls/setupKeyboard.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

prepareSprites();
setupGamePad();
setupKeyboard();

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
  const userId = 'User-Demo';
  const [game, setGame] = useClientGame(
    map,
    userId,
    metadata?.effects || new Map(),
    startAction,
  );

  const onAction = useClientGameAction(game, setGame);
  const zoom = useScale();
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-20% 0px 6% 0px' });

  return (
    <div ref={ref}>
      <GameMap
        currentUserId={userId}
        factionNames={new Map()}
        fogStyle="soft"
        key="play-demo-map"
        lastActionResponse={game.lastAction}
        map={game.state}
        margin="minimal"
        onAction={onAction}
        pan
        paused={!isInView}
        scale={zoom}
        scroll={false}
        style="floating"
        tilted
        userDisplayName="Player"
      >
        {(props, actions) => {
          const hide =
            !isInView || props.lastActionResponse?.type === 'GameEnd';

          return (
            <>
              <MapInfo hide={hide} leftOffset {...props} />
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
