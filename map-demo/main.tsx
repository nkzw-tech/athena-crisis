/// <reference types="vite/client" />

import './styles.css';
import { MapMetadata } from '@deities/apollo/MapMetadata.tsx';
import { prepareSprites } from '@deities/art/Sprites.tsx';
import MapData from '@deities/athena/MapData.tsx';
import GameMap from '@deities/hera/GameMap.tsx';
import useClientGame from '@deities/hera/hooks/useClientGame.tsx';
import useClientGameAction from '@deities/hera/hooks/useClientGameAction.tsx';
import useClientGamePlayerDetails from '@deities/hera/hooks/useClientGamePlayerDetails.tsx';
import { HideContext } from '@deities/hera/hooks/useHide.tsx';
import LocaleContext from '@deities/hera/i18n/LocaleContext.tsx';
import { getTileSize } from '@deities/hera/Tiles.tsx';
import GameActions from '@deities/hera/ui/GameActions.tsx';
import DemoViewer from '@deities/hera/ui/lib/DemoViewer.tsx';
import MapInfo from '@deities/hera/ui/MapInfo.tsx';
import { UndoType } from '@deities/hermes/game/undo.tsx';
import demo1, { metadata as demo1Metadata } from '@deities/hermes/map-fixtures/demo-1.tsx';
import demo2, { metadata as demo2Metadata } from '@deities/hermes/map-fixtures/demo-2.tsx';
import demo3, { metadata as demo3Metadata } from '@deities/hermes/map-fixtures/demo-3.tsx';
import shrine, { metadata as shrineMetadata } from '@deities/hermes/map-fixtures/shrine.tsx';
import closeToHome, {
  metadata as closeToHomeMetadata,
} from '@deities/hermes/map-fixtures/they-are-close-to-home.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Button from '@deities/ui/Button.tsx';
import setupGamePad from '@deities/ui/controls/setupGamePad.tsx';
import setupHidePointer from '@deities/ui/controls/setupHidePointer.tsx';
import setupKeyboard from '@deities/ui/controls/setupKeyboard.tsx';
import initializeCSS from '@deities/ui/CSS.tsx';
import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import { AlertContext } from '@deities/ui/hooks/useAlert.tsx';
import useScale, { ScaleContext } from '@deities/ui/hooks/useScale.tsx';
import { css, injectGlobal } from '@emotion/css';
import { VisibilityStateContext } from '@nkzw/use-visibility-state';
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

type DemoMap = Readonly<{ map: MapData; metadata: MapMetadata }>;

const maps: ReadonlyArray<DemoMap> = [
  { map: demo1, metadata: demo1Metadata },
  { map: demo2, metadata: demo2Metadata },
  { map: demo3, metadata: demo3Metadata },
  { map: shrine, metadata: shrineMetadata },
  { map: closeToHome, metadata: closeToHomeMetadata },
];

const startAction = { type: 'Start' } as const;

initializeCSS();
injectGlobal(`
  :root {
    ${cssVar('safe-area-bottom', 'env(safe-area-inset-bottom, 0px)')}
    ${cssVar('safe-area-top', 'env(safe-area-inset-top, 0px)')}
  }
`);

// Browsers block sound until the player interacts with the page.
AudioPlayer.pause();
setupGamePad();
setupHidePointer();
setupKeyboard();

if (import.meta.env.DEV) {
  import('@deities/hera/ui/fps/Fps.tsx');
}

function Game({ map, metadata }: DemoMap) {
  const [renderKey, setRenderKey] = useState(0);
  const zoom = useScale(getTileSize(map.config.biome));
  const [game, setGame, undo] = useClientGame(
    map,
    DemoViewer.id,
    metadata.effects || new Map(),
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

  return (
    <GameMap
      autoPanning
      currentUserId={DemoViewer.id}
      fogStyle="soft"
      key={renderKey}
      lastActionResponse={game.lastAction}
      map={game.state}
      margin="minimal"
      onAction={onAction}
      pan
      playerDetails={playerDetails}
      scale={zoom}
      scroll={false}
      style="floating"
      tilted
    >
      {(props, actions) => {
        const hide = props.lastActionResponse?.type === 'GameEnd';
        return (
          <>
            <MapInfo hide={hide} {...props} />
            <GameActions
              actions={actions}
              canUndoAction
              fade={renderKey === 0}
              hide={hide}
              state={{ ...props, inlineUI: true }}
              undo={onUndo}
              zoom={zoom}
            />
          </>
        );
      }}
    </GameMap>
  );
}

function App() {
  const [index, setIndex] = useState(0);
  const [hasSprites, setHasSprites] = useState(false);

  useEffect(() => {
    prepareSprites()
      .then(() => setHasSprites(true))
      .catch(() => setHasSprites(true));
  }, []);

  return (
    <div className={pageStyle}>
      <nav className={pickerStyle}>
        {maps.map(({ metadata }, mapIndex) => (
          <Button
            key={metadata.name}
            onClick={() => setIndex(mapIndex)}
            selected={mapIndex === index}
          >
            {metadata.name}
          </Button>
        ))}
      </nav>
      {/* Remount on map change so the game state starts fresh. */}
      {hasSprites && <Game key={index} {...maps[index]} />}
    </div>
  );
}

const pageStyle = css`
  padding: 16px;
`;

const pickerStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;

  // Buttons render as links, so keep them from using the link color.
  > a:not(.hover):not(:hover) {
    color: ${applyVar('text-color')};
  }
`;

createRoot(document.getElementById('app')!).render(
  <LocaleContext>
    <ScaleContext>
      <VisibilityStateContext>
        <HideContext>
          <AlertContext>
            <App />
          </AlertContext>
        </HideContext>
      </VisibilityStateContext>
    </ScaleContext>
  </LocaleContext>,
);
