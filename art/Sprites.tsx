import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { injectGlobal } from '@emotion/css';
import paletteSwap, { HEX } from '@nkzw/palette-swap';
import Variants from 'athena-crisis:asset-variants';
import { AssetDomain, AssetVersion } from './AssetInfo.tsx';
import BiomeVariants from './BiomeVariants.tsx';
import VariantConfiguration, {
  SpriteVariantConfiguration,
} from './VariantConfiguration.tsx';

type Resource = Readonly<[name: string, url: string]>;
type Resources = ReadonlyArray<Resource>;
type PaletteSwapFn = typeof paletteSwap;
type PaletteSwapParameters = Parameters<PaletteSwapFn>;
type DropFirstInTuple<T extends Array<unknown>> = T extends [
  unknown,
  ...infer Rest,
]
  ? Rest
  : never;
type MaybePaletteSwapParameters = [
  image: PaletteSwapParameters[0] | null,
  ...DropFirstInTuple<PaletteSwapParameters>,
];

type Canvas = ReturnType<PaletteSwapFn> extends ReadonlyMap<unknown, infer V>
  ? V
  : never;

type CanvasToURLFn = (canvas: Canvas, name: string) => Promise<string>;

const shouldSwap = () =>
  process.env.NODE_ENV !== 'production' ||
  process.env.IS_DEMO ||
  !navigator.onLine;

// Keep remote images in memory forever.
const imageCache = [];

const cacheImage = (path: string): [HTMLImageElement, Promise<void>] => {
  const image = new Image();
  imageCache.push(image);
  image.src = path;
  const promise = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (error) => reject(error);
  });
  return [image, promise];
};

const getFallbackURL = (name: string) => {
  const path = `${AssetDomain}/${AssetVersion}/${name}.png`;
  cacheImage(path);
  return path;
};

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });

const _canvasToURL = (canvas: Canvas) =>
  new Promise<string>((resolve, reject) =>
    (canvas as unknown as HTMLCanvasElement).toBlob((blob) => {
      if (!blob) {
        reject('Oops.');
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png'),
  );

const imageIsDefined = (
  args: MaybePaletteSwapParameters,
): args is PaletteSwapParameters => args[0] !== null;

const swap = (...args: MaybePaletteSwapParameters) => {
  if (shouldSwap() && imageIsDefined(args)) {
    return [...paletteSwap(...args)];
  }

  return [...args[1].keys()].map((key) => [key, null] as const);
};

const emptySet = new Set<HEX>();
const emptyMap = new Map<HEX, HEX>();
const nullPromise = Promise.resolve(null);

const imageMap = new Map<string, [HTMLImageElement, Promise<void>]>();
let sprites = new Map<string, string>();
let preparePromise: Promise<ReadonlyMap<string, string>> | null = null;
let portraitsPrepared = false;
let spritesPrepared = false;

if (Variants.size !== VariantConfiguration.size) {
  throw new Error(
    `Sprites: 'Variant' and 'VariantMap' definitions are out of sync.`,
  );
}

const _prepareSprites = async (
  spriteVariants: ReadonlyMap<SpriteVariant, SpriteVariantConfiguration>,
  canvasToURL: CanvasToURLFn,
  isBuild: boolean,
) => {
  const promises: Array<Promise<ReadonlyArray<Resources>>> = [];
  for (const [
    imageName,
    { asImage, ignoreMissing = false, variantNames, waterSwap },
  ] of spriteVariants) {
    if (!Variants.has(imageName)) {
      throw new Error(`Sprites: Missing variant details for '${imageName}'.`);
    }

    const variantDetails = Variants.get(imageName);
    promises.push(
      (shouldSwap() && variantDetails
        ? loadImage(variantDetails.source)
        : nullPromise
      ).then((image) =>
        Promise.all(
          swap(
            image,
            variantDetails?.variants ||
              new Map([...variantNames].map((name) => [name, emptyMap])),
            variantDetails ? variantDetails.staticColors : emptySet,
            null,
            {
              ignoreMissing,
              imageName,
            },
          ).map(async ([variant, canvas]) => {
            const name = `${imageName}-${variant}`;
            const resource = canvas
              ? await canvasToURL(canvas, name)
              : getFallbackURL(name);
            const item = [name, resource] as Resource;
            if (asImage) {
              imageMap.set(name, cacheImage(resource));
            }

            // Preload only the images that are most likely used on most maps.
            if (!canvas && (variant === 0 || variant === 1 || variant === 2)) {
              imageMap.set(name, cacheImage(resource));
            }

            if (!waterSwap) {
              return [item];
            }

            return canvas
              ? loadImage(resource)
                  .then((blobImage) =>
                    Promise.all(
                      swap(blobImage, BiomeVariants, null, null, {
                        ignoreMissing: true,
                      }).map(async ([biome, waterSwapCanvas]) => {
                        const name = `${imageName}-${variant}-${biome}`;
                        const resource = waterSwapCanvas
                          ? await canvasToURL(waterSwapCanvas, name)
                          : getFallbackURL(name);
                        return [name, resource] as Resource;
                      }),
                    ),
                  )
                  .then((waterSwapResources) => [item, ...waterSwapResources])
              : [
                  item,
                  ...[...BiomeVariants.keys()].map((biome) => {
                    const name = `${imageName}-${variant}-${biome}`;
                    return [name, getFallbackURL(name)] as Resource;
                  }),
                ];
          }),
        ),
      ),
    );
  }

  const images = (await Promise.all(promises)).flatMap((list) => list.flat());

  if (!isBuild) {
    await Promise.all([...imageMap].map(([, [, promise]]) => promise));
  }

  injectGlobal(
    images
      .map(
        ([name, url]) => `.Sprite-${name} { background-image: url('${url}'); }`,
      )
      .join('\n'),
  );
  portraitsPrepared = true;
  spritesPrepared = true;
  return (sprites = new Map(images));
};

export async function preparePortraits() {
  return (
    preparePromise ||
    _prepareSprites(
      new Map([['Portraits', VariantConfiguration.get('Portraits')!]]),
      _canvasToURL,
      false,
    ).then((sprites) => {
      portraitsPrepared = true;
      return sprites;
    })
  );
}

export async function prepareSprites(
  canvasToURL: CanvasToURLFn = _canvasToURL,
  isBuild = false,
) {
  return (
    preparePromise ||
    (preparePromise = _prepareSprites(
      VariantConfiguration,
      canvasToURL,
      isBuild,
    ))
  );
}

export function hasPreparedPortraits() {
  return portraitsPrepared;
}

export function hasPreparedSprites() {
  return spritesPrepared;
}

export function hasSpriteURL(
  sprite: SpriteVariant,
  variant: number,
  biome?: Biome,
) {
  if (!sprites.size) {
    throw new Error(
      `Invalid \`hasSpriteURL('${sprite}', ${variant}, ${biome})\` invocation.`,
    );
  }

  return sprites.has(`${sprite}-${variant}${biome ? `-${biome}` : ''}`);
}

export function spriteURL(sprite: SpriteVariant, variant: number) {
  if (!sprites.size) {
    throw new Error(
      `Invalid \`spriteURL('${sprite}', ${variant})\` invocation.`,
    );
  }

  const image = sprites.get(`${sprite}-${variant}`);
  if (!image) {
    throw new Error(`spriteURL: Image not found for ${sprite}-${variant}.`);
  }

  return image;
}

export function spriteImage(
  sprite: SpriteVariant,
  variant: number,
): HTMLImageElement {
  if (!sprites.size) {
    throw new Error(
      `Invalid \`spriteImage('${sprite}', ${variant})\` invocation.`,
    );
  }

  const image = imageMap.get(`${sprite}-${variant}`);
  if (!image) {
    throw new Error(`spriteImage: Image not found for ${sprite}-${variant}.`);
  }

  return image[0];
}
