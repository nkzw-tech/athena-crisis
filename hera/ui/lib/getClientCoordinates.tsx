import { isSafari } from '@deities/ui/Browser.tsx';
import cssVar from '@deities/ui/cssVar.tsx';
import parseInteger from '@nkzw/core/parseInteger.js';
import { ClientCoordinates } from '../../lib/toTransformOrigin.tsx';

export default function getClientCoordinates(element?: Element | null): ClientCoordinates {
  if (!element) {
    return { clientX: 'center', clientY: 'center' };
  }

  const scale = isSafari
    ? parseInteger(getComputedStyle(element).getPropertyValue(cssVar('scale'))) || 2
    : 1;
  const rect = element.getBoundingClientRect();

  return {
    clientX: rect.left + (rect.width / 2) * scale,
    clientY: rect.top + (rect.height / 2) * scale,
  };
}
