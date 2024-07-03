import sortBy from '@deities/hephaestus/sortBy.tsx';
import { Objectives } from '../Objectives.tsx';

export default function getNextObjectiveId(objectives: Objectives) {
  const list = sortBy([...objectives], ([id]) => id);
  for (let i = 0; i < list.length; i++) {
    if (!objectives.has(i)) {
      return i;
    }
  }
  return list.length;
}
