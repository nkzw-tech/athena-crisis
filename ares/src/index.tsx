/// <reference types="vite/client" />

import LocaleContext from '@deities/hera/i18n/LocaleContext.tsx';
import UnitPreviews from '@deities/hera/ui/demo/UnitPreviews.tsx';
import initializeCSS from '@deities/ui/CSS.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import { createRoot } from 'react-dom/client';

initializeCSS();

import('./a.tsx');
import('./b.tsx');

const App = () => {
  return (
    <LocaleContext>
      <InlineLink onClick={() => {}}>Hi!</InlineLink>
      <UnitPreviews />
    </LocaleContext>
  );
};

const render = () =>
  createRoot(document.getElementById('app')!).render(<App />);

render();

if (import.meta.env.DEV) {
  import('@deities/hera/ui/fps/Fps.tsx');
}
