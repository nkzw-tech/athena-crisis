import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';
import root from './root.ts';

const require = createRequire(import.meta.url);
const pixelarticonsRoot = dirname(
  require.resolve('pixelarticons/package.json', {
    paths: [join(root, 'ui'), join(root, 'ares'), join(root, 'hera')],
  }),
);
const importPattern = /^pixelarticons\/svg\/([a-z0-9-]+)\.svg$/;
const virtualPrefix = '\0pixelarticons-svg-icon:';
const virtualIdPattern = new RegExp(`^${virtualPrefix}`);
const iconModuleCache = new Map<string, Promise<string>>();
const attributeRegexCache = new Map<string, RegExp>();

const getAttribute = (attributes: string, name: string) => {
  let regex = attributeRegexCache.get(name);

  if (!regex) {
    regex = new RegExp(`\\s${name}="([^"]+)"`);
    attributeRegexCache.set(name, regex);
  }

  return attributes.match(regex)?.[1] || null;
};

const getSize = (attributes: string, name: 'height' | 'width') => {
  const value = getAttribute(attributes, name);
  return value ? Number.parseFloat(value) : null;
};

const normalizeIconColors = (body: string) =>
  body.replaceAll(/\sfill="(?:black|#000(?:000)?)"/gi, ' fill="currentColor"');

const parseSvg = (svg: string) => {
  const match = svg.match(/^\s*<svg\b([^>]*)>([\s\S]*?)<\/svg>\s*$/);

  if (!match) {
    throw new Error('Invalid Pixelarticons SVG.');
  }

  const [, attributes, rawBody] = match;
  const viewBox = getAttribute(attributes, 'viewBox')?.split(/\s+/).map(Number);
  const width = getSize(attributes, 'width') || viewBox?.[2] || 24;
  const height = getSize(attributes, 'height') || viewBox?.[3] || 24;
  let body = normalizeIconColors(rawBody.trim());

  const fill = getAttribute(attributes, 'fill')?.replace(/^black$|^#000(?:000)?$/i, 'currentColor');
  const stroke = getAttribute(attributes, 'stroke');
  const groupAttributes = [
    fill && !/\sfill=/.test(body) ? `fill="${fill}"` : null,
    stroke && !/\sstroke=/.test(body) ? `stroke="${stroke}"` : null,
  ].filter(Boolean);

  if (groupAttributes.length) {
    body = `<g ${groupAttributes.join(' ')}>${body}</g>`;
  }

  return { body, height, width };
};

const createIconModule = (icon: string) => {
  const cached = iconModuleCache.get(icon);

  if (cached) {
    return cached;
  }

  const module = readFile(join(pixelarticonsRoot, 'svg', `${icon}.svg`), 'utf8').then(
    (svg) => `const data = ${JSON.stringify(parseSvg(svg))};\nexport default data;\n`,
  );
  iconModuleCache.set(icon, module);
  return module;
};

export default function pixelarticonsPlugin(): Plugin {
  return {
    enforce: 'pre',
    load: {
      filter: {
        id: virtualIdPattern,
      },
      async handler(id) {
        if (!id.startsWith(virtualPrefix)) {
          return null;
        }

        return {
          code: await createIconModule(id.slice(virtualPrefix.length)),
          moduleType: 'js',
        };
      },
    },
    name: 'pixelarticons-svg-icon',
    resolveId: {
      filter: {
        id: importPattern,
      },
      handler(source) {
        const match = source.match(importPattern);
        return match ? `${virtualPrefix}${match[1]}` : null;
      },
    },
  };
}
