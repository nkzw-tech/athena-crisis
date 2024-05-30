import { HideContext } from '@deities/hera/hooks/useHide.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import setupGamePad from '@deities/ui/controls/setupGamePad.tsx';
import setupKeyboard from '@deities/ui/controls/setupKeyboard.tsx';
import { getScopedCSSDefinitions } from '@deities/ui/CSS.tsx';
import { applyVar, initializeCSSVariables } from '@deities/ui/cssVar.tsx';
import { AlertContext } from '@deities/ui/hooks/useAlert.tsx';
import { ScaleContext } from '@deities/ui/hooks/useScale.tsx';
import { setDefaultPortalContainer } from '@deities/ui/Portal.tsx';
import { css } from '@emotion/css';
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

const clientScopeStyle = css`
  all: initial;

  color: ${applyVar('text-color')};
  font-family: Athena, ui-sans-serif, system-ui, sans-serif;
  font-size: 20px;
  font-weight: normal;
  line-height: 1em;
  outline: none;
  touch-action: pan-x pan-y;

  img {
    max-width: initial;
  }

  svg {
    display: initial;
  }

  ${getScopedCSSDefinitions()}
`;

if (!document.querySelector('body > div.portal')) {
  const portal = document.createElement('div');
  portal.classList.add('portal');
  portal.classList.add(clientScopeStyle);
  document.body.append(portal, document.body.childNodes[0]);
  setDefaultPortalContainer(portal);
}

if (!document.querySelector('body > div.background')) {
  const background = document.createElement('div');
  background.classList.add('background');
  document.body.insertBefore(background, document.body.childNodes[0]);
}

AudioPlayer.pause();
setupKeyboard();
setupGamePad();

if (import.meta.env.DEV) {
  import('@deities/hera/ui/fps/Fps.tsx');
}

export default function ClientScope({ children }: { children: JSX.Element }) {
  return (
    <ScaleContext>
      <HideContext>
        <AlertContext>
          <div className={clientScopeStyle}>{children}</div>
        </AlertContext>
      </HideContext>
    </ScaleContext>
  );
}
