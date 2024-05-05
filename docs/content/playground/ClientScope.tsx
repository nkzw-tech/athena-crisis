import { initializeCSSVariables } from '@deities/ui/cssVar.tsx';
import { ScaleContext } from '@deities/ui/hooks/useScale.tsx';
import { css, injectGlobal } from '@emotion/css';
import { init as initFbt, IntlVariations } from 'fbt';

initializeCSSVariables();

initFbt({
  hooks: {
    getViewerContext: () => ({
      GENDER: IntlVariations.GENDER_UNKNOWN,
      locale: 'en_US',
    }),
  },
  translations: {},
});

injectGlobal(`
@font-face {
  font-display: swap;
  font-family: Athena;
  src: url('/fonts/AthenaNova.woff2');
}

body {
  font-family: Athena, ui-sans-serif, system-ui, sans-serif;
  font-size: 20px;
  font-weight: normal;
  line-height: 1em;
}

`);

if (import.meta.env.DEV) {
  import('@deities/hera/ui/fps/Fps.tsx');
}

export default function ClientScope({ children }: { children: JSX.Element }) {
  return (
    <ScaleContext>
      <div className={style}>{children}</div>
    </ScaleContext>
  );
}

const style = css`
  all: initial;

  font-family: Athena, ui-sans-serif, system-ui, sans-serif;
  outline: none;
`;
