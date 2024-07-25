let pointerEnabled = true;

const showPointer = () => {
  if (!pointerEnabled) {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    pointerEnabled = true;
  }
};

export function hidePointer() {
  if (pointerEnabled) {
    if (!document.pointerLockElement) {
      document.body.requestPointerLock?.();
    }
    pointerEnabled = false;
  }
}

let setup = false;

export default function setupHidePointer() {
  if (setup) {
    return;
  }

  setup = true;
  document.addEventListener('pointermove', showPointer);
  document.addEventListener('click', showPointer);

  return () => {
    document.removeEventListener('pointermove', showPointer);
    document.removeEventListener('click', showPointer);
  };
}
