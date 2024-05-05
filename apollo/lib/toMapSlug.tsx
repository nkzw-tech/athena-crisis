import toSlug from '@deities/hephaestus/toSlug.tsx';

export default function toMapSlug(username: string, slug: string) {
  return `${username}/${toSlug(slug)}`;
}
