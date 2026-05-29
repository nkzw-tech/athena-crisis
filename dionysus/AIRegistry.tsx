import { AIRegistryT } from '@deities/apollo/actions/executeGameAction.tsx';
import DiomedesEpsilon from './DiomedesEpsilon.tsx';
import DionysusAlpha from './DionysusAlpha.tsx';
import OdysseusDelta from './OdysseusDelta.tsx';
import PersephoneBeta from './PersephoneBeta.tsx';

export const AIID = {
  DiomedesEpsilon: 2,
  DionysusAlpha: 0,
  OdysseusDelta: 3,
  PersephoneBeta: 1,
} as const;

export type AIID = (typeof AIID)[keyof typeof AIID];

const AIRegistry: AIRegistryT = new Map([
  [
    AIID.DionysusAlpha,
    { class: DionysusAlpha, description: 'Default', name: 'DionysusAlpha', published: true },
  ],
  [
    AIID.PersephoneBeta,
    { class: PersephoneBeta, description: 'Hard', name: 'PersephoneBeta', published: false },
  ],
  [
    AIID.DiomedesEpsilon,
    { class: DiomedesEpsilon, description: 'Internal', name: 'DiomedesEpsilon', published: false },
  ],
  [
    AIID.OdysseusDelta,
    { class: OdysseusDelta, description: 'Internal', name: 'OdysseusDelta', published: false },
  ],
]);

export default AIRegistry;
