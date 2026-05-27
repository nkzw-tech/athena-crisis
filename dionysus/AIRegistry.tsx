import { AIRegistryT } from '@deities/apollo/actions/executeGameAction.tsx';
import DiomedesEpsilon from './DiomedesEpsilon.tsx';
import DionysusAlpha from './DionysusAlpha.tsx';
import OdysseusDelta from './OdysseusDelta.tsx';
import PersephoneBeta from './PersephoneBeta.tsx';

const AIRegistry: AIRegistryT = new Map([
  [0, { class: DionysusAlpha, name: 'DionysusAlpha', published: true }],
  [1, { class: PersephoneBeta, name: 'PersephoneBeta', published: false }],
  [2, { class: DiomedesEpsilon, name: 'DiomedesEpsilon', published: false }],
  [3, { class: OdysseusDelta, name: 'OdysseusDelta', published: false }],
]);

export default AIRegistry;
