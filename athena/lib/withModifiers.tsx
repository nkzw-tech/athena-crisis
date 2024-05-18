import type MapData from '../MapData.tsx';
import { getAllModifiers } from './getModifier.tsx';

export default function withModifiers(map: MapData) {
  return map.copy({ modifiers: getAllModifiers(map) });
}
