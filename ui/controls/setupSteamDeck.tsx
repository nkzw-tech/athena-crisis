import { App } from '../App.tsx';
import { FloatingGamepadTextInputMode } from './GamepadTextInput.tsx';

const inputTypes = new Set([
  'text',
  'password',
  'search',
  'email',
  'number',
  'tel',
  'url',
]);
let currentElement: HTMLInputElement | null = null;
let setupHasRun = false;

export default function setupSteamDeck() {
  if (setupHasRun || !App.isSteamDeck()) {
    return;
  }

  setupHasRun = true;

  document.addEventListener('focusin', (event) => {
    const input = event.target as HTMLInputElement | null;
    if (input?.tagName === 'INPUT' && input !== currentElement) {
      if (!inputTypes.has(input.type)) {
        return;
      }

      currentElement = input;
      setTimeout(() => (currentElement = null), 1000);

      const dimensions = input.getBoundingClientRect();
      App.showFloatingGamepadTextInput(
        FloatingGamepadTextInputMode.SingleLine,
        Math.max(0, dimensions.x - window.scrollX || 0),
        Math.max(0, dimensions.y - window.scrollY || 0),
        dimensions.width || 200,
        dimensions.height || 40,
      );
    }
  });
}
