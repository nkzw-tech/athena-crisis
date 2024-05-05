export default function isInView(element: Element, zoom: number, offset = 0) {
  const { bottom, left, right, top } = element.getBoundingClientRect();
  return (
    top * zoom >= offset &&
    left * zoom >= offset &&
    bottom * zoom <= window.innerHeight - offset &&
    right * zoom <= window.innerWidth - offset
  );
}
