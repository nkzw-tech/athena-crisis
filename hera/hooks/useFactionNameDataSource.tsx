import FactionNames from '@deities/athena/info/FactionNames.tsx';
import {
  TypeaheadDataSource,
  TypeaheadDataSourceEntry,
} from '@deities/ui/Typeahead.tsx';
import { useMemo } from 'react';

const entries = FactionNames.map(
  (factionName) =>
    new TypeaheadDataSourceEntry(factionName, factionName, factionName),
);

export default function useFactionNameDataSource() {
  return useMemo(() => {
    const dataSource = new TypeaheadDataSource<string>();
    dataSource.addEntries(entries);
    return dataSource;
  }, []);
}
