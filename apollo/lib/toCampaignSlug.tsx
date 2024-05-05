import toSlug from '@deities/hephaestus/toSlug.tsx';

export default function toCampaignSlug(username: string, slug: string) {
  return `${username}/campaign/${toSlug(slug)}`;
}
