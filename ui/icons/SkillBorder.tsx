const icon = (body: string) =>
  ({
    body,
    height: 28,
    width: 31,
  }) as const;

const full = icon(
  `<path fill="currentColor" d="M2 26h24v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 2h2v24h-2z"/>`,
);

export default full;

export const SkillBorderIcons = {
  coin: icon(
    `<path fill="currentColor" d="M26 2h2v17h-2zM2 26h20v2H2v-2ZM28 26h1v-1h-1zM2 0h24v2H2zM0 2h2v24H0zM24 23h5v-1h-5zM24 27h5v-1h-5zM24 24h1v-1h-1zM26 22h1v-1h-1zM24 25h5v-1h-5zM26 28h1v-1h-1z"/>`,
  ),
  down: icon(
    `<path fill="currentColor" d="M28 27h1v-1h-1zM26 28h1v-1h-1zM27 28h1v-1h-1zM24 26h1v-1h-1zM23 25h1v-1h-1zM30 25h1v-1h-1zM29 26h1v-1h-1zM25 27h1v-1h-1zM2 26h19v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 2h2v20h-2z"/>`,
  ),
  fold: icon(
    `<path fill="currentColor" d="M26 2h2v14h-2zM2 26h19v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 24h1v-6h-1zM23 26h7v-1h-7zM25 28h3v-1h-3zM25 20h1v-1h-1zM24 21h1v-1h-1zM27 20h1v-1h-1zM28 21h1v-1h-1z"/>`,
  ),
  full,
  move: icon(
    `<path fill="currentColor" d="M22 23h7v3h-7z"/><path fill="currentColor" d="M27 22h1v5h-1zM29 24h1v1h-1zM26 21h1v7h-1zM2 26h18v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 2h2v17h-2z"/>`,
  ),
  plus: icon(
    `<path fill="currentColor" d="M24 24h2v2h-2v-2ZM28 24h2v2h-2zM26 22h2v6h-2zM2 26h20v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 2h2v18h-2z"/>`,
  ),
  speed: icon(
    `<path fill="currentColor" d="M26 2h2v16h-2zM2 26h19v2H2v-2ZM26 27.028v1h1v-1zM2 0h24v2H2zM0 2h2v24H0z"/><path fill="currentColor" fill-rule="evenodd" d="M28.033 23.048v-1h1v1h-1Zm0 3v-1h1v1h-1ZM25.033 23.019v-1h1v1h-1Zm0 3v-1h1v1h-1Z" clip-rule="evenodd"/><path fill="currentColor" d="M27.01 26.038v1h1v-1zM26.038 23.029v1h1v-1zM26.028 24.029v1h1v-1zM29.028 24.057v1h1v-1zM27.057 21.038v1h1v-1zM29.038 23.057v1h1v-1zM26.067 20.029v1h1v-1zM24.057 21.01v1h1v-1zM23.067 20v1h1v-1zM23 27v1h1v-1zM24.01 26.01v1h1v-1z"/>`,
  ),
  unfold: icon(
    `<path fill="currentColor" d="M26 2h2v14h-2zM2 26h19v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 24h1v-6h-1zM23 26h7v-1h-7zM25 28h3v-1h-3zM25 23h1v-1h-1zM24 22h1v-1h-1zM27 23h1v-1h-1zM28 22h1v-1h-1z"/>`,
  ),
  up: icon(
    `<path fill="currentColor" d="M25 26h1v-1h-1zM28 26h1v-1h-1zM26 25h1v-1h-1zM27 25h1v-1h-1zM24 27h1v-1h-1zM23 28h1v-1h-1zM30 28h1v-1h-1zM29 27h1v-1h-1zM2 26h19v2H2v-2ZM2 0h24v2H2zM0 2h2v24H0zM26 2h2v20h-2z"/>`,
  ),
  up2x: icon(
    `<path fill="currentColor" d="M26 2h2v17h-2zM2 26h19v2H2v-2ZM30 25h1v-1h-1zM2 0h24v2H2zM0 2h2v24H0z"/><path fill="currentColor" fill-rule="evenodd" d="M26 23h-1v-1h1v1Zm3 0h-1v-1h1v1ZM26 26h-1v-1h1v1Zm3 0h-1v-1h1v1Z" clip-rule="evenodd"/><path fill="currentColor" d="M29 24h1v-1h-1zM26 25h1v-1h-1zM27 25h1v-1h-1zM27 22h1v-1h-1zM24 24h1v-1h-1zM26 22h1v-1h-1zM23 25h1v-1h-1zM24 27h1v-1h-1zM23 28h1v-1h-1zM30 28h1v-1h-1zM29 27h1v-1h-1z"/>`,
  ),
} as const;

export type SkillIconBorderStyle = keyof typeof SkillBorderIcons;
