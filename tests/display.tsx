/// <reference types="vite/client" />

import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import {
  InstantAnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import NullBehavior from '@deities/hera/behavior/NullBehavior.tsx';
import GameMap from '@deities/hera/GameMap.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import initializeCSS from '@deities/ui/CSS.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { css, cx, injectGlobal } from '@emotion/css';
import React, { useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

declare global {
  // eslint-disable-next-line no-var
  var MapHasRendered: Record<string, boolean>;
  // eslint-disable-next-line no-var
  var renderMap: (url: string) => void;
}

initializeCSS();

// Playwright does not like audio.
AudioPlayer.pause();

const root = createRoot(document.getElementById('app')!);
window.renderMap = (url: string) => {
  window.MapHasRendered = Object.create(null);
  root.render(<DisplayMap url={url} />);
};

const animationSpeed = {
  human: InstantAnimationConfig,
  regular: InstantAnimationConfig,
};

const ErrorComponent = ({ error }: { error: Error }) => (
  <>
    {Object.keys(window.MapHasRendered).map((key) => {
      window.MapHasRendered[key] = true;
      return (
        <div className={redStyle} data-testid={`map-${key}`} key={key}>
          {error.message}
        </div>
      );
    })}
  </>
);

const DisplayMap = ({ url: initialURL }: { url: string }) => {
  const url = new URL(initialURL);
  const maps = url.searchParams.getAll('map[]');
  const viewers = url.searchParams.getAll('viewer[]');
  const gameActionResponses = url.searchParams.getAll('gameActionResponse[]');
  const eventEmitters = useMemo(
    () => maps.map(() => new EventTarget()),
    [maps],
  );

  // Initialize global state for listeners.
  gameActionResponses?.forEach((_, index) => {
    window.MapHasRendered[index] = false;
  });

  useEffect(() => {
    if (gameActionResponses?.length) {
      gameActionResponses.forEach((gameActionResponse, index) => {
        eventEmitters[index].dispatchEvent(
          new CustomEvent('action', {
            detail: decodeGameActionResponse(JSON.parse(gameActionResponse)),
          }),
        );
        eventEmitters[index].addEventListener('actionsProcessed', () =>
          setTimeout(() => {
            window.MapHasRendered[index] = true;
          }, 300),
        );
      });
    }
  }, [eventEmitters, gameActionResponses, initialURL]);

  return (
    <ErrorBoundary FallbackComponent={ErrorComponent} key={initialURL}>
      {maps.map((mapData, index) => {
        const map = MapData.fromJSON(mapData);
        if (!map) {
          return (
            <div
              className={cx(wrapperStyle, redStyle)}
              data-testid={`map-${index}`}
              key={index}
            >
              Could not render Map {index}
            </div>
          );
        }
        return (
          <div key={index}>
            <div className={inlineStyle} data-testid={`map-${index}`}>
              <GameMap
                animationSpeed={animationSpeed}
                behavior={NullBehavior}
                confirmActionStyle="never"
                currentUserId={viewers[index]}
                events={eventEmitters?.[index]}
                fogStyle="soft"
                map={map}
                paused
                playerDetails={new Map()}
                scale={1}
                scroll={false}
                showCursor={false}
                style="none"
                tilted={false}
              />
            </div>
          </div>
        );
      })}
    </ErrorBoundary>
  );
};

injectGlobal(`
  body {
    line-height: 1px;
  }
`);

const redStyle = css`
  color: ${applyVar('error-color')};
  font-weight: bold;
`;

const inlineStyle = css`
  display: inline-block;
`;

const wrapperStyle = css`
  padding-top: ${TileSize}px;
`;

document.body.style.background = '#fff';
document.body.style.margin = '0px';
document.body.style.padding = '0px';

renderMap(window.location.href);
