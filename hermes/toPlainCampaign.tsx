import { Campaign, PlainCampaign, PlainLevel } from './Types.tsx';
import unrollCampaign from './unrollCampaign.tsx';

export default function toPlainCampaign<T>(
  campaign: Campaign<T>,
): PlainCampaign<T> {
  const levels = new Map<T, PlainLevel<T>>();
  for (const [mapId, { next }] of unrollCampaign(campaign)) {
    levels.set(mapId, {
      mapId,
      next: next
        ? next.map((entry) =>
            Array.isArray(entry) ? [entry[0], entry[1].mapId] : entry.mapId,
          )
        : undefined,
    });
  }
  return {
    ...campaign,
    levels,
    next: campaign.next.mapId,
  };
}
