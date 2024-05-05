import { css, cx } from '@emotion/css';

export default function maybeFade(hide?: boolean) {
  return cx(style, hide && fadeStyle);
}

const style = css`
  opacity: 1;
  transition: opacity 300ms ease-in-out;
`;

const fadeStyle = css`
  opacity: 0 !important;
`;
