import type { AIRegistryT } from '@deities/apollo/actions/executeGameAction.tsx';
import DionysusAlpha from './DionysusAlpha.tsx';

const AIRegistry: AIRegistryT = new Map([
  [0, { class: DionysusAlpha, name: 'Alpha', published: true }],
]);

export default AIRegistry;
