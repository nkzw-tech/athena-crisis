import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { EncodedGameActionResponse, GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import playwright, { Browser, Page } from 'playwright';

const APP_PORT = 3001;
const BASE_URL = `http://localhost:${APP_PORT}/display.html`;

type CaptureOptions = {
  fogStyle?: 'hard' | 'soft';
  style?: 'floating' | 'none';
};

const getURL = (
  maps: ReadonlyArray<MapData>,
  viewers: string | ReadonlyArray<string>,
  gameActionResponse?: ReadonlyArray<EncodedGameActionResponse>,
  options?: CaptureOptions,
) =>
  `${BASE_URL}?${maps
    .map((map) => 'map[]=' + encodeURIComponent(JSON.stringify(map)))
    .join('&')}&${(Array.isArray(viewers) ? viewers : Array(maps.length).fill(viewers))
    .map((viewer) => 'viewer[]=' + encodeURIComponent(viewer))
    .join('&')}${
    gameActionResponse
      ?.map((response) => '&gameActionResponse[]=' + encodeURIComponent(JSON.stringify(response)))
      .join('') || ''
  }${options?.fogStyle ? '&fogStyle=' + encodeURIComponent(options.fogStyle) : ''}${
    options?.style ? '&style=' + encodeURIComponent(options.style) : ''
  }`;

let instance: Browser | null;

export type Image = string | Buffer;

let page: Page | null;

export async function capture(
  maps: ReadonlyArray<MapData>,
  viewers: string | ReadonlyArray<string>,
  gameActionResponses?: ReadonlyArray<EncodedGameActionResponse>,
  options?: CaptureOptions,
): Promise<ReadonlyArray<Image>> {
  if (!instance) {
    instance = await playwright.chromium.connect(
      readFileSync(join(import.meta.dirname, 'testSetup'), 'utf8'),
    );
  }

  const url = getURL(maps, viewers, gameActionResponses, options);
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
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

  const screenshots = [];
  // Serially process screenshots to avoid race condtions.
  for (let index = 0; index < maps.length; index++) {
    const selector = `[data-testid="map-${index}"]`;
    if (options?.fogStyle || options?.style) {
      await page.waitForSelector(
        `${selector}${options.fogStyle ? `[data-fog-style="${options.fogStyle}"]` : ''}${
          options.style ? `[data-map-style="${options.style}"]` : ''
        }`,
      );
    }
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
  options?: CaptureOptions,
): Promise<Image> {
  return (await capture([map], viewers, undefined, options))[0];
}

export async function getMainFogCanvasAlphaSummary() {
  if (!page) {
    throw new Error('Cannot inspect fog canvas before capturing a map.');
  }

  return page.evaluate(() => {
    const canvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>('canvas[data-fog-layer="saturation"]'),
    );
    const canvas = canvases[0];
    if (!canvas || !canvases.length) {
      return null;
    }
    const mapElement = canvas.closest<HTMLElement>('[data-map-width]');
    const mapWidth = Number(mapElement?.dataset.mapWidth || 0);
    const mapHeight = Number(mapElement?.dataset.mapHeight || 0);
    const offsetX = mapWidth ? canvas.width / (mapWidth + 2) : 0;
    const offsetY = mapHeight ? canvas.height / (mapHeight + 2) : 0;
    const canvasData = canvases.map(
      (canvas) => canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data,
    );
    const getAlpha = (index: number) =>
      Math.round(
        (1 - canvasData.reduce((transparent, data) => transparent * (1 - data[index] / 255), 1)) *
          255,
      );
    const alphaValues = new Set<number>();
    const innerAlphaValues = new Set<number>();
    for (let index = 3; index < canvasData[0].length; index += 4) {
      alphaValues.add(getAlpha(index));
    }
    for (let y = offsetY; y < canvas.height - offsetY; y++) {
      for (let x = offsetX; x < canvas.width - offsetX; x++) {
        innerAlphaValues.add(getAlpha((y * canvas.width + x) * 4 + 3));
      }
    }
    return {
      fogStyle: canvas.dataset.fogStyle,
      height: canvas.height,
      innerUniqueAlphaCount: innerAlphaValues.size,
      uniqueAlphaCount: alphaValues.size,
      width: canvas.width,
    };
  });
}

export async function getRenderedGameMapState(index = 0) {
  if (!page) {
    throw new Error('Cannot inspect map state before capturing a map.');
  }

  return page.evaluate((index) => window.GameMapStates?.[index] ?? null, index);
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
