const listener = (event: DragEvent) => {
  const target = event.target;
  if (target && 'tagName' in target && target.tagName === 'A') {
    event.preventDefault();
  }
};

export default function preventDragging() {
  document.addEventListener('dragstart', listener);
}
