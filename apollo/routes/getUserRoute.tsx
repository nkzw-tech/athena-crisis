import { Route, UserRoute } from '../Routes.tsx';

export default function getUserRoute(
  username: string,
  route?: UserRoute,
): Route {
  return `/${username}${route ? '/' + route : ''}` as Route;
}
