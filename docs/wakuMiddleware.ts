import mdRouter from './node_modules/vocs/dist/waku/internal/middleware/md-router.js';
import redirects from './node_modules/vocs/dist/waku/internal/middleware/redirects.js';

const middleware = {
  mdRouter,
  redirects,
};

export function middlewareModules(overrides: Record<string, () => Promise<unknown>> = {}) {
  const internal = Object.fromEntries(
    Object.entries(middleware).map(([key, value]) => [
      key,
      () => Promise.resolve({ default: value }),
    ]),
  );

  return { ...internal, ...overrides };
}
