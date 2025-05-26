import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { injectGlobal } from '@emotion/css';
import { isFirefox, isSafari } from './Browser.tsx';
import { getScale } from './hooks/useScale.tsx';

type GlobalCSSVariableName =
  // Map
  | 'animation-duration-30'
  | 'animation-duration-70'
  | 'animation-duration'
  | 'mouse-position-left'
  | 'mouse-position-right'
  | 'perspective-transform'
  | 'perspective-height'
  | 'scale'
  | 'unit-animation-step'
  | 'unit-move-duration'
  // Player Colors
  | 'color-black'
  | 'color-blue'
  | 'color-cyan'
  | 'color-gray'
  | 'color-green'
  | 'color-neutral'
  | 'color-orange'
  | 'color-pink'
  | 'color-purple'
  | 'color-red'
  // UI
  | 'color-gold-base'
  | 'color-gold'
  | 'color-orange-green'
  | 'color-red-orange'
  | 'color-silver'
  | 'error-color'
  | 'safe-area-bottom'
  | 'safe-area-top'
  | 'transform-origin'
  | 'ui-is-scaled'
  | 'ui-scale'
  // Map Editor insets
  | 'inset'
  | 'inset-z'
  // Styles
  | 'background-color-active'
  | 'background-color-bright'
  | 'background-color-dark'
  | 'background-color-light'
  | 'background-color-light7'
  | 'background-color-light9'
  | 'background-color'
  | 'border-color-light'
  | 'border-color'
  | 'highlight-color'
  | 'text-color-active-light'
  | 'text-color-active'
  | 'text-color-bright'
  | 'text-color-light'
  | 'text-color';

export class CSSVariables<T> {
  private id = 0;
  private map = new Map<T, string>();
  constructor(private readonly prefix: string) {}

  private getId(name: T) {
    const value = this.map.get(name);
    if (!value) {
      const value =
        String(this.id++) +
        (process.env.NODE_ENV === 'development' ? `-${name}` : '');
      this.map.set(name, value);
      return value;
    }
    return value;
  }

  set(name: T, value?: string | number): `--${string}` {
    return `--${this.prefix}${this.getId(name)}${
      value != null ? `: ${value};` : ''
    }`;
  }

  apply(name: T): `var(--${string})` {
    return `var(--${this.prefix}${this.getId(name)})`;
  }
}

const variables = new CSSVariables<GlobalCSSVariableName>('a');
const cssVar = variables.set.bind(variables);

export default cssVar;
export const applyVar = variables.apply.bind(variables);

export function insetStyle(inset: number | string) {
  return {
    [variables.set('inset-z')]: inset ? 1 : 0,
    [variables.set('inset')]: `${
      typeof inset === 'string' ? inset : `${inset}px`
    }`,
  };
}

const transform = cssVar(
  'perspective-transform',
  isFirefox
    ? ''
    : (isSafari ? `translateZ(-25px) ` : '') +
        `perspective(calc(125px - ${applyVar('perspective-height')} / 20 * 10px)) rotateX(calc(2deg - ${applyVar('perspective-height')} / 20 * 1deg))`,
);

const lightMode = `
${cssVar('background-color-active', '#a7c2f5')}
${cssVar('background-color-bright', '#ffffff')}
${cssVar('background-color-dark', 'rgba(40, 40, 40, 1)')}
${cssVar('background-color-light', 'rgba(255, 255, 255, 0.8)')}
${cssVar('background-color-light7', 'rgba(255, 255, 255, 0.7)')}
${cssVar('background-color-light9', 'rgba(255, 255, 255, 0.9)')}
${cssVar('background-color', '#f2f2f2')}
${cssVar('border-color-light', 'rgba(0, 0, 0, 0.2)')}
${cssVar('border-color', 'rgba(0, 0, 0, 0.7)')}

${cssVar('highlight-color', '#3999d4')}
${cssVar('text-color-active-light', '#fff')}
${cssVar('text-color-bright', '#fff')}
${cssVar('text-color-active', '#111')}
${cssVar('text-color-light', '#808080')}
${cssVar('text-color', '#111')}

// Player Colors
${cssVar('color-black', '10, 10, 10')}
${cssVar('color-blue', '60, 157, 255')}
${cssVar('color-cyan', '33, 195, 155')}
${cssVar('color-gray', '132, 132, 132')}
${cssVar('color-green', '94, 163, 24')}
${cssVar('color-neutral', '179, 160, 124')}
${cssVar('color-orange', '255, 158, 60')}
${cssVar('color-pink', '195, 33, 127')}
${cssVar('color-purple', '157, 60, 255')}
${cssVar('color-red', '195, 46, 33')}

${cssVar('color-red-orange', 'rgb(225, 102, 46.5)')}
${cssVar('color-orange-green', 'rgb(134.5, 160.5, 42)')}
`;

const darkMode = `
${cssVar('background-color-active', '#596884')}
${cssVar('background-color-bright', '#121212')}
${cssVar('background-color-dark', '#d7d7d7')}
${cssVar('background-color-light', 'rgba(50, 50, 50, 0.8)')}
${cssVar('background-color-light7', 'rgba(50, 50, 50, 0.7)')}
${cssVar('background-color-light9', 'rgba(50, 50, 50, 0.9)')}
${cssVar('background-color', '#28282b')}

${cssVar('border-color-light', 'rgba(255, 255, 255, 0.2)')}
${cssVar('border-color', 'rgba(255, 255, 255, 0.7)')}

${cssVar('highlight-color', '#5e9fff')}
${cssVar('text-color-active-light', '#555')}
${cssVar('text-color-bright', '#fff')}
${cssVar('text-color-active', '#f5f5f5')}
${cssVar('text-color-light', '#a7a7a7')}
${cssVar('text-color', '#f5f5f5')}

// Player Colors
${cssVar('color-black', '10, 10, 10')}
${cssVar('color-blue', '60, 157, 235')}
${cssVar('color-cyan', '45, 197, 146')}
${cssVar('color-gray', '132, 132, 132')}
${cssVar('color-green', '142, 169, 53')}
${cssVar('color-neutral', '204, 193, 155')}
${cssVar('color-orange', '216, 154, 78')}
${cssVar('color-pink', '255, 60, 200')}
${cssVar('color-purple', '157, 80, 255')}
${cssVar('color-red', '255, 76, 60')}
${cssVar('color-red-orange', 'rgb(230, 125, 76)')}
${cssVar('color-orange-green', 'rgb(153, 182, 47)')}
`;

let initialized = false;
export function initializeCSSVariables() {
  if (initialized) {
    return;
  }

  initialized = true;
  injectGlobal(`
:root {
  ${lightMode}

  ${cssVar('color-gold-base', '233, 179, 1')}
  ${cssVar('color-gold', `rgb(${applyVar('color-gold-base')})`)}
  ${cssVar('color-silver', 'rgb(235, 235, 235)')}
  
  // Common Variables
  ${cssVar('error-color', '#c4362e')}
  ${cssVar('inset-z', 0)}
  ${cssVar('inset', '0px')}
  ${cssVar('mouse-position-left', '0px')}
  ${cssVar('mouse-position-right', 'auto')}
  ${cssVar('scale', getScale(TileSize))}
  ${cssVar('transform-origin', 'center center')}
  ${cssVar('ui-scale', 1)}
  ${cssVar('perspective-height', 0)}
  ${transform}
}

@media (prefers-color-scheme: dark) {
  :root {
   ${darkMode}
  }
}

html.dark {
  ${darkMode}
}

div.lightMode {
  ${lightMode}

  color: ${applyVar('text-color')};
`);
}
