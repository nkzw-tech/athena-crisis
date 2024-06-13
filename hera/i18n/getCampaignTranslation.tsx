import { CampaignMetadata } from './CampaignMap.tsx';

export default function getCampaignTranslation(value: string): string {
  return CampaignMetadata[value as keyof typeof CampaignMetadata]?.() || value;
}
