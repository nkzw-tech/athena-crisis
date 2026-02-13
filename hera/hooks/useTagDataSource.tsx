import { TypeaheadDataSource, TypeaheadDataSourceEntry } from '@deities/ui/Typeahead.tsx';
import { useMemo } from 'react';

export const DEFAULT_TAGS = ['pvp', 'published', 'campaign', 'scenario', 'mirror', 'escort'].map(
  (tag) => new TypeaheadDataSourceEntry(tag, tag, tag),
);

export default function useTagDataSource() {
  return useMemo(() => {
    const dataSource = new TypeaheadDataSource<string>();
    dataSource.addEntries(DEFAULT_TAGS);
    return dataSource;
  }, []);
}
