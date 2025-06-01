import { ClientCoordinates } from '../../lib/toTransformOrigin.tsx';

export default function getClientCoordinates(
  element?: Element | null,
): ClientCoordinates {
  if (!element) {
    return { clientX: 'center', clientY: 'center' };
  }

  const rect = element.getBoundingClientRect();
  return {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  };
}
