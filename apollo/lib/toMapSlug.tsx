import toSlug from './toSlug.tsx';

export default function toMapSlug(username: string, slug: string) {
  return `${username}/${toSlug(slug)}`;
}
