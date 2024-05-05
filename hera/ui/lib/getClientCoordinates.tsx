import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import cssVar from '@deities/ui/cssVar.tsx';
import { ClientCoordinates } from '../../lib/toTransformOrigin.tsx';

export default function getClientCoordinates(
  element?: Element | null,
): ClientCoordinates {
  if (!element) {
    return { clientX: 'center', clientY: 'center' };
  }

  const zoom =
    parseInteger(getComputedStyle(element).getPropertyValue(cssVar('scale'))) ||
    2;
  const rect = element.getBoundingClientRect();
  return {
    clientX: (rect.left + rect.width / 2) * zoom,
    clientY: (rect.top + rect.height / 2) * zoom,
  };
}
