import { Route } from '@deities/apollo/Routes.tsx';

export default function getGameRoute({
  campaignStateId,
  id,
}: {
  campaignStateId: string | null | undefined;
  id: string;
}): Route {
  return campaignStateId ? `/campaign/${campaignStateId}` : `/game/${id}`;
}
