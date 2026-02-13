import { PlainEntity } from '../map/Entity.tsx';

export default function filterNullables<T extends PlainEntity | Record<string, unknown>>(
  object: T,
): T {
  for (const key in object) {
    if (object[key] == null) {
      delete object[key];
    }
  }
  return object;
}
