import { css, keyframes } from '@emotion/css';
import { useEffect } from 'react';

const getPosition = (element: HTMLDivElement, offset: number) => {
  try {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return {
      x: matrix.m41 % -offset,
      y: matrix.m42 % offset,
    };
  } catch {
    /* empty */
  }
  return { x: 0, y: 0 };
};

const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? null;
const concurrency = navigator.hardwareConcurrency ?? null;

export default function useBackgroundAnimation() {
  useEffect(() => {
    if (
      (memory != null && memory < 2) ||
      (concurrency != null && concurrency < 2)
    ) {
      return;
    }

    const element = document.querySelector<HTMLDivElement>('div.background');
    if (!element) {
      return;
    }

    const offset = 72;
    const { x, y } = getPosition(element, offset);
    // eslint-disable-next-line @deities/no-inline-css
    const animate = css`
      animation: ${keyframes`
          0% {
            transform: translate3d(${x}px, ${y}px, 0);
          }
          100% {
            transform: translate3d(${x - offset}px, ${y + offset}px, 0);
          }
        `} 10s linear infinite;
    `;
    element.classList.add(animate);
    return () => {
      element.style.transform = getComputedStyle(element).transform;
      element.classList.remove(animate);
    };
  }, []);
}
