const formElements = new Set(['input', 'button', 'select', 'textarea']);

export default function isControlElement() {
  const element = document.activeElement;
  const type = element?.nodeName?.toLowerCase();
  return !!(
    element &&
    type &&
    formElements.has(type) &&
    'type' in element &&
    element.type !== 'range' &&
    element.type !== 'checkbox'
  );
}
