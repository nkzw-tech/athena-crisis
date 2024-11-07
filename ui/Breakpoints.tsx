export const xl = 1536;
export const lg = 1024;
export const sm = 640;
export const xs = 440;

export const height = { lg: 801, sm, xl: 1025 };

export default {
  height: {
    lg: `@media (min-height: ${height.lg}px)`,
    sm: `@media (min-height: ${sm}px)`,
    xl: `@media (min-height: ${height.xl}px)`,
    xs: `@media (min-height: ${xs}px)`,
  },
  landscape: `@media (min-aspect-ratio: 4/3)`,
  lg: `@media (min-width: ${lg}px)`,
  sm: `@media (min-width: ${sm}px)`,
  xl: `@media (min-width: ${xl}px)`,
  xs: `@media (min-width: ${xs}px)`,
};
