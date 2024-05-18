import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import type {
  EncodedGameActionResponse,
  GameState,
} from '@deities/apollo/Types.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { Browser, Page } from 'playwright';
import playwright from 'playwright';

const APP_PORT = 3001;
const BASE_URL = `http://localhost:${APP_PORT}/display.html`;

const getURL = (
  maps: ReadonlyArray<MapData>,
  viewers: string | ReadonlyArray<string>,
  gameActionResponse?: ReadonlyArray<EncodedGameActionResponse>,
) =>
  `${BASE_URL}?${maps
    .map((map) => 'map[]=' + encodeURIComponent(JSON.stringify(map)))
    .join('&')}&${(Array.isArray(viewers)
    ? viewers
    : Array(maps.length).fill(viewers)
  )
    .map((viewer) => 'viewer[]=' + encodeURIComponent(viewer))
    .join('&')}${
    gameActionResponse
      ?.map(
        (response) =>
          '&gameActionResponse[]=' +
          encodeURIComponent(JSON.stringify(response)),
      )
      .join('') || ''
  }`;

let instance: Browser | null;

export type Image = string | Buffer;

let page: Page | null;

export async function capture(
  maps: ReadonlyArray<MapData>,
  viewers: string | ReadonlyArray<string>,
  gameActionResponses?: ReadonlyArray<EncodedGameActionResponse>,
): Promise<ReadonlyArray<Image>> {
  if (!instance) {
    instance = await playwright.chromium.connect(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), 'testSetup'),
        'utf8',
      ),
    );
  }

  const url = getURL(maps, viewers, gameActionResponses);
  // Uncomment to view the screenshot URL in the terminal. Unfortunately the
  // long URLs don't currently work with `terminal-link` in iTerm2.
  // console.log(url);

  if (!page) {
    page = await instance.newPage({ deviceScaleFactor: 2 });
    page.setDefaultNavigationTimeout(0);
    await page.setViewportSize({ height: 768, width: 1024 });
    await page.goto(url);
  } else {
    await page.evaluate(`window.renderMap(${JSON.stringify(url)});`);
  }

  const screenshots = [];
  // Serially process screenshots to avoid race condtions.
  for (let index = 0; index < maps.length; index++) {
    const selector = `[data-testid="map-${index}"]`;
    if (gameActionResponses?.[index]) {
      await page.waitForFunction(`window.MapHasRendered[${index}] === true`);
    }
    const screenshot = await page.locator(selector).screenshot();
    if (!screenshot) {
      throw new Error(`Could not screenshot map ${index}.`);
    }
    screenshots.push(screenshot);
  }
  return screenshots;
}

export async function captureOne(
  map: MapData,
  viewers: string,
): Promise<Image> {
  return (await capture([map], viewers))[0];
}

export async function captureGameActionResponse(
  map: MapData,
  gameActionResponse: EncodedGameActionResponse,
  viewers: string,
) {
  return (await capture([map], viewers, [gameActionResponse]))[0];
}

export async function captureGameState(
  gameState: GameState,
  viewers: string | ReadonlyArray<string>,
): Promise<ReadonlyArray<[ActionResponse, MapData, Image]>> {
  const screenshots = await capture(
    gameState.map(([, map]) => map),
    viewers,
  );

  return gameState.map((state, index) => [...state, screenshots[index]]);
}
