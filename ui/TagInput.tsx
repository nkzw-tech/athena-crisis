import { css, cx } from '@emotion/css';
import { useMemo, useRef } from 'react';
import Stack from './Stack.tsx';
import { TagListInternal } from './TagList.tsx';
import Typeahead, {
  TypeaheadDataSource,
  TypeaheadDataSourceEntry,
} from './Typeahead.tsx';

export default function TagInput<T>({
  dataSource,
  freeform,
  setTags,
  stringify = String,
  emptySuggestions,
  tags,
  toValue = stringify,
}: {
  dataSource: TypeaheadDataSource<T>;
  emptySuggestions?: ReadonlyArray<TypeaheadDataSourceEntry<T>>;
  freeform?: boolean;
  setTags: (tags: ReadonlyArray<T>) => void;
  stringify?: (tag: T) => string;
  tags: ReadonlyArray<T>;
  toValue?: (tag: T) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(undefined);
  const ignoreList = useMemo(() => new Set(tags.map(toValue)), [tags, toValue]);
  return (
    <Stack
      alignCenter
      className={cx('fake-input', fakeInputStyle)}
      gap
      onClick={() => inputRef.current?.focus()}
      start
      stretch
    >
      <TagListInternal
        editable
        setTags={setTags}
        stringify={stringify}
        tags={tags}
      />
      <div className={inputStyle}>
        <Typeahead
          dataSource={dataSource}
          emptySuggestions={emptySuggestions}
          freeform={freeform}
          ignoreList={ignoreList}
          inputClassName={resetStyle}
          inputRef={inputRef}
          onBackspace={() => setTags(tags.slice(0, -1))}
          onSelect={(result) => {
            setTags([
              ...new Map(
                [...tags, result.data].map((tag) => [toValue(tag), tag]),
              ).values(),
            ]);
            return '';
          }}
          resultClassName={resultStyle}
        />
      </div>
    </Stack>
  );
}

const fakeInputStyle = css`
  cursor: text;
  min-height: 41px;
  width: 100%;
`;

const inputStyle = css`
  min-width: 200px;
  flex: 1;
`;

const resetStyle = css`
  html body & {
    background: transparent;
    border: none;
    box-shadow: none;
    display: inline-block;
    margin: -3px 0 0 4px;
    padding: 2px;
    width: 100%;

    &:focus {
      box-shadow: none;
    }
  }
`;

const resultStyle = css`
  left: 0;
  right: 0;
`;
