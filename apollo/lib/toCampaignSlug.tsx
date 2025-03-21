import toSlug from './toSlug.tsx';

export default function toCampaignSlug(username: string, slug: string) {
  return `${username}/campaign/${toSlug(slug)}`;
}
