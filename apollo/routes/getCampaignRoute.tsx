import { Route, UserCampaignRoute } from '../Routes.tsx';

export default function getCampaignRoute(
  slug: string,
  route?: UserCampaignRoute,
): Route {
  return `/${slug}${route ? '/' + route : ''}` as Route;
}
