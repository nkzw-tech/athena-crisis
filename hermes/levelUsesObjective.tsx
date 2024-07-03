import { ObjectiveID } from '@deities/athena/Objectives.tsx';
import { PlainLevel } from './Types.tsx';

export default function levelUsesObjective<T>(
  id: ObjectiveID,
  { next }: PlainLevel<T>,
) {
  if (next) {
    for (const entry of next) {
      if (Array.isArray(entry) && entry[0] === id) {
        return true;
      }
    }
  }
  return false;
}
