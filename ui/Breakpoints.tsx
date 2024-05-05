export const xl = 1536;
export const lg = 1024;
export const sm = 640;
const xs = 440;

export const height = { lg: 801, sm, xl: 1025 };

export default {
  height: {
    lg: `@media (min-height: ${height.lg}px)`,
    sm: `@media (min-height: ${sm}px)`,
    xl: `@media (min-height: ${height.xl}px)`,
  },
  lg: `@media (min-width: ${lg}px)`,
  sm: `@media (min-width: ${sm}px)`,
  xl: `@media (min-width: ${xl}px)`,
  xs: `@media (min-width: ${xs}px)`,
};
