import { DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import { injectGlobal } from '@emotion/css';
import Background from './assets/Background.png';
import Breakpoints from './Breakpoints.tsx';
import { isAndroid, isLinux } from './Browser.tsx';
import cssVar, { applyVar, initializeCSSVariables } from './cssVar.tsx';

const koreanOrChinese = ['AthenaLatin', 'ui-sans-serif', 'system-ui', 'sans-serif'];
const russianOrUkrainian = ['Athena', 'PressStart2P', 'ui-sans-serif', 'system-ui', 'sans-serif'];

export const Fonts = {
  ja_JP: ['Athena', 'MadouFutoMaru', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  ko_KR: koreanOrChinese,
  ru_RU: russianOrUkrainian,
  uk_UA: russianOrUkrainian,
  zh_CN: koreanOrChinese,
};

const scope = `
svg {
  vertical-align: middle;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
  vertical-align: middle;
}

table th,
table td {
  font-weight: normal;
  text-align: left;
  vertical-align: middle;
}

a img {
  border: none;
}

a {
  color: ${applyVar('highlight-color')};
  cursor: pointer;
  outline: 0;
  text-decoration: none;
}

ul {
  font-size: 1em;
  line-height: 1.2em;
  margin: 0;
  padding: 0;
}

ul li {
  display: block;
  list-style-type: none;
  margin: 0;
}

h1, h2 {
  font-size: 1.2em;
  font-weight: normal;
  letter-spacing: 1px;
  line-height: 1.1em;
  margin: 0;
  text-transform: uppercase;

  ${Breakpoints.xs} {
    font-size: 1.5em;
    letter-spacing: 1.5px;
  }

  ${Breakpoints.sm} {
    font-size: 1.75em;
    letter-spacing: 1.8px;
  }
}

h2 {
  font-size: 1em;
  letter-spacing: 1px;

  ${Breakpoints.xs} {
    font-size: 1em;
    letter-spacing: 1px;
  }

  ${Breakpoints.sm} {
    font-size: 1em;
    letter-spacing: 1px;
  }
}

p, .paragraph {
  line-height: 1.4em;
  margin: 0;
  user-select: text;
}
`;

const global = `
* {
  box-sizing: border-box;
}

html.dark div.background {
  filter: invert(1);
}

html {
  -webkit-text-size-adjust: 100%;
  height: 100vh;
  height: -webkit-fill-available;
  height: fill-available;
}

body {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  background: ${applyVar('background-color')};
  color: ${applyVar('text-color')};
  font-family: Athena, ui-sans-serif, system-ui, sans-serif;
  font-size: ${isLinux ? 19 : 20}px;
  font-weight: normal;
  line-height: 1em;
  margin: 0;
  overscroll-behavior: none;
  touch-action: pan-x pan-y;
  user-select: none;
}

::-webkit-scrollbar {
  display: none;
}

html[lang="ja_JP"] body, .locale-ja_JP {
  font-family: ${Fonts.ja_JP.join(', ')};
}

html[lang="uk_UA"] body, html[lang="ru_RU"] body, .locale-uk_UA, .locale-ru_RU {
  font-family: ${Fonts.ru_RU.join(', ')};
}

html[lang="ko_KR"] body, .locale-ko_KR, html[lang="zh_CN"] body, .locale-zh_CN {
  font-family: ${Fonts.ko_KR.join(', ')};
}

body .all-fonts {
  font-family: Athena, PressStart2P, MadouFutoMaru, ui-sans-serif, system-ui, sans-serif;
}

:root {
  ${cssVar('safe-area-top', isAndroid ? `${TileSize / 2}px` : 'env(safe-area-inset-top, 0)')}
  ${cssVar('safe-area-bottom', isAndroid ? `${TileSize / 2}px` : 'env(safe-area-inset-bottom, 0)')}
}
  
@media (orientation: portrait) {
  :root {
    ${cssVar('safe-area-top', isAndroid ? `${DoubleSize}px` : 'env(safe-area-inset-top, 0)')}
    ${cssVar('safe-area-bottom', isAndroid ? `${DoubleSize}px` : 'env(safe-area-inset-bottom, 0)')}
  }

  body {
    margin-top: ${applyVar('safe-area-top')};
  }
}

div.background, div.background-absolute {
  background-image: url('${Background}');
  bottom: 0;
  image-rendering: pixelated;
  left: -144px;
  overflow: hidden;
  pointer-events: none;
  position: fixed;
  right: -144px;
  top: -144px;
  transform: ${applyVar('perspective-transform')};
  zoom: ${applyVar('scale')};
}

div.background-absolute {
  position: absolute;
}

@media (prefers-color-scheme: dark) {
  div.background {
    filter: invert(1);
  }

}

${scope}
`;

let initialized = false;
export default function initializeCSS() {
  if (initialized) {
    return;
  }

  initialized = true;
  initializeCSSVariables();
  injectGlobal(global);
}

export function getScopedCSSDefinitions() {
  return scope;
}
