export const RegularDrawingMode = {
  body: `<path fill="currentColor" d="M10 10h4v4h-4z"/>`,
  height: 24,
  width: 24,
};

export const HorizontalDrawingMode = {
  body: `<path fill="currentColor" d="M11 21V3h2v18zM3 14v-4h4v4zM17 14v-4h1v4zM20 14v-4h1v4zM18 14v-1h2v1zM18 11v-1h2v1z"/>`,
  height: 24,
  width: 24,
};

export const VerticalDrawingMode = {
  body: `<path fill="currentColor" d="M3 11h18v2H3zM10 3h4v4h-4zM10 17h4v1h-4zM10 20h4v1h-4zM10 18h1v2h-1zM13 18h1v2h-1z"/>`,
  height: 24,
  width: 24,
};

export const DiagonalDrawingMode = {
  body: `<path fill="currentColor" d="M11 13v-2h2v2zM9 15v-2h2v2zM13 11V9h2v2zM7 17v-2h2v2zM15 9V7h2v2zM17 7V5h2v2zM5 19v-2h2v2zM5 9V5h4v4zM15 19v-4h1v4zM18 19v-4h1v4zM16 19v-1h2v1zM16 16v-1h2v1z"/>`,
  height: 24,
  width: 24,
};

export const HorizontalVerticalDrawingMode = {
  body: `<path fill="currentColor" d="M3 11h18v2H3zM4 4h4v4H4zM16 16h4v1h-4zM16 19h4v1h-4zM16 17h1v2h-1zM19 17h1v2h-1zM16 4h4v1h-4zM16 7h4v1h-4zM16 5h1v2h-1zM19 5h1v2h-1zM4 16h4v1H4zM4 19h4v1H4zM4 17h1v2H4zM7 17h1v2H7z"/><path fill="currentColor" d="M11 3h2v18h-2z"/>`,
  height: 24,
  width: 24,
};
