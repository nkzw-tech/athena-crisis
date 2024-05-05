import Stack from './Stack.tsx';
import Tag from './Tag.tsx';

type TagListProps<T> = Readonly<{
  className?: string;
  editable?: true;
  setTags?: (tags: ReadonlyArray<T>) => void;
  stringify: (tag: T) => string;
  tags: ReadonlyArray<T>;
}>;

export function TagListInternal<T>({
  className,
  editable,
  setTags,
  stringify,
  tags,
}: TagListProps<T>) {
  return tags.map((tag) => {
    const tagString = stringify(tag);
    return (
      <Tag
        className={className}
        key={tagString}
        removeTag={
          editable && setTags
            ? () => setTags(tags.filter((currentTag) => currentTag !== tag))
            : undefined
        }
        tag={tagString}
      />
    );
  });
}

export default function TagList<T>({
  className,
  stringify = String,
  ...props
}: Omit<TagListProps<T>, 'stringify'> & { stringify?: (tag: T) => string }) {
  return (
    <Stack alignCenter className={className} gap start stretch>
      <TagListInternal stringify={stringify} {...props} />
    </Stack>
  );
}
