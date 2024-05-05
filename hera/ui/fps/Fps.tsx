import { createRoot } from 'react-dom/client';
import { HideContext } from '../../hooks/useHide.tsx';
import Fps from './FpsComponent.tsx';

const root = document.createElement('div');
createRoot(root).render(
  <HideContext>
    <Fps />
  </HideContext>,
);
document.body.append(root);
