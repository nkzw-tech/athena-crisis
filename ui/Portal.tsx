import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

let defaultContainer = document.body;

export function setDefaultPortalContainer(container: HTMLElement) {
  defaultContainer = container;
}

export default function Portal({
  children,
  container = defaultContainer,
}: {
  children: ReactNode;
  container?: HTMLElement;
}) {
  return createPortal(children, container);
}
