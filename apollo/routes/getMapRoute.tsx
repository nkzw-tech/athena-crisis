import type { Route, UserMapRoute } from '../Routes.tsx';

export default function getMapRoute(slug: string, route?: UserMapRoute): Route {
  return `/${slug}${route ? '/' + route : ''}` as Route;
}
