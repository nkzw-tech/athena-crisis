// Thanks Tomo
import { css, cx } from '@emotion/css';
import type {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  MutableRefObject,
  ReactNode,
} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BoxStyle } from './Box.tsx';
import clipBorder from './clipBorder.tsx';
import useDirectionalNavigation from './controls/useDirectionalNavigation.tsx';
import useInput from './controls/useInput.tsx';
import { applyVar } from './cssVar.tsx';
import ellipsis from './ellipsis.tsx';

type QueryCallback<T> = (
  value: string,
  results: ReadonlyArray<TypeaheadDataSourceEntry<T>>,
) => void;
type QueryHandler = (value: string) => void;

const QUERY_DELAY = 100;
const parseTokens = (value: string) => value.toLocaleLowerCase().split(/\s+/);

export class TypeaheadDataSource<T> {
  private pendingQuery: number | null;
  private queryCallbacks: Set<QueryCallback<T>>;
  private mostRecentQuery: string;
  private entriesSet: Set<string>;
  private entryBuckets: Map<number, Set<TypeaheadDataSourceEntry<T>>>;
  private previousQueries: Set<string>;

  constructor(
    private readonly queryHandler: QueryHandler | null = null,
    private readonly maxResults = 10,
  ) {
    this.pendingQuery = null;
    this.queryCallbacks = new Set();
    this.mostRecentQuery = '';
    this.entriesSet = new Set();
    this.entryBuckets = new Map();
    this.previousQueries = new Set();
  }

  addEntries(entries: ReadonlyArray<TypeaheadDataSourceEntry<T>>) {
    const uniqueEntries: Array<TypeaheadDataSourceEntry<T>> = [];
    const intermediateEntryBuckets: Array<Array<TypeaheadDataSourceEntry<T>>> =
      [];

    entries.forEach((entry) => {
      const value = entry.value;
      if (!this.entriesSet.has(value)) {
        uniqueEntries.push(entry);
        this.entriesSet.add(value);
        const index = entry.tokens.length - 1;
        if (!intermediateEntryBuckets[index]) {
          intermediateEntryBuckets[index] = [];
        }
        intermediateEntryBuckets[index].push(entry);
      }
    });

    intermediateEntryBuckets.forEach((entryBucket, index) => {
      for (let ii = 0; ii <= index; ii++) {
        for (let jj = 0; jj < entryBucket.length; jj++) {
          const entry = entryBucket[jj];
          this.insertEntry(entry.tokens[ii].charCodeAt(0), entry);
        }
      }
    });

    this.query(this.mostRecentQuery);
  }

  updateEntry(entry: TypeaheadDataSourceEntry<T>) {
    this.entriesSet.delete(entry.value);

    for (const [, bucket] of this.entryBuckets) {
      for (const currentEntry of bucket) {
        if (currentEntry.value === entry.value) {
          bucket.delete(currentEntry);
          break;
        }
      }
    }

    this.addEntries([entry]);
  }

  query(value: string) {
    if (!this.queryCallbacks.size) {
      return;
    }

    const results = this.getQueryResults(value);
    for (const callback of this.queryCallbacks) {
      callback(value, results);
    }

    if (
      value &&
      this.queryHandler &&
      results.length < this.maxResults &&
      !this.previousQueries.has(value)
    ) {
      if (this.pendingQuery) {
        clearTimeout(this.pendingQuery);
      }
      this.pendingQuery = window.setTimeout(() => {
        this.previousQueries.add(value);
        this.queryHandler?.(value);
        this.pendingQuery = null;
      }, QUERY_DELAY);
    }
  }

  getQueryResults(value: string): ReadonlyArray<TypeaheadDataSourceEntry<T>> {
    const results: Set<TypeaheadDataSourceEntry<T>> = new Set();
    let resultsCount = 0;
    const queryTokens = parseTokens(value);
    const firstCharCode = queryTokens[0].charCodeAt(0);
    const eligibleEntries = this.entryBuckets.get(firstCharCode);

    if (value !== '' && eligibleEntries) {
      for (const entry of eligibleEntries) {
        const entryTokens = entry.tokens;
        if (tokensMatch(queryTokens, entryTokens)) {
          results.add(entry);
          resultsCount++;
        }
        if (resultsCount === this.maxResults) {
          break;
        }
      }
    }

    this.mostRecentQuery = value;
    return Array.from(results);
  }

  addQueryCallback(callback: QueryCallback<T>) {
    this.queryCallbacks.add(callback);
  }

  removeQueryCallback(callback: QueryCallback<T>) {
    this.queryCallbacks.delete(callback);
  }

  private insertEntry(key: number, entry: TypeaheadDataSourceEntry<T>) {
    const bucket = this.entryBuckets.get(key) ?? new Set();
    if (!this.entryBuckets.has(key)) {
      this.entryBuckets.set(key, bucket);
    }
    if (!bucket.has(entry)) {
      bucket.add(entry);
    }
  }
}

function tokensMatch(
  queryTokens: ReadonlyArray<string>,
  entryTokens: ReadonlyArray<string>,
) {
  const numQueryTokens = queryTokens.length;
  const numEntryTokens = entryTokens.length;
  let checked = 0;
  let matched = 0;

  while (matched < numQueryTokens && checked < numEntryTokens) {
    const queryToken = queryTokens[matched];
    const entryToken = entryTokens[checked];
    if (entryToken.startsWith(queryToken) && ++matched === numQueryTokens) {
      return true;
    }
    checked++;
  }

  return matched === numQueryTokens;
}

export class TypeaheadDataSourceEntry<T> {
  public readonly tokens: ReadonlyArray<string>;

  constructor(
    public readonly text: string,
    public readonly value: string,
    public readonly data: T,
  ) {
    this.text = text;
    this.value = value;
    this.tokens = parseTokens(text);
  }
}

export default function Typeahead<T>({
  autoFocus,
  autoHide = true,
  dataSource,
  emptySuggestions,
  freeform,
  ignoreList,
  initialValue,
  inputClassName,
  inputRef,
  onBackspace,
  onSelect,
  placeholder,
  renderItem = (result: TypeaheadDataSourceEntry<T>) => result.text,
  renderList: renderResults,
  resultClassName,
}: {
  autoFocus?: boolean;
  autoHide?: boolean;
  dataSource: TypeaheadDataSource<T>;
  emptySuggestions?: ReadonlyArray<TypeaheadDataSourceEntry<T>>;
  freeform?: boolean;
  ignoreList?: ReadonlySet<string>;
  initialValue?: string;
  inputClassName?: string;
  inputRef?: MutableRefObject<HTMLInputElement | undefined>;
  onBackspace?: () => void;
  onSelect?: (result: TypeaheadDataSourceEntry<T>) => string | void;
  placeholder?: string;
  renderItem?: (
    result: TypeaheadDataSourceEntry<T>,
    isHighlighted?: boolean,
  ) => ReactNode;
  renderList?: (
    results: ReadonlyArray<TypeaheadDataSourceEntry<T>>,
    config: {
      isHighlighted: (index: number) => boolean;
      onSelect: (result: TypeaheadDataSourceEntry<T>) => void;
      renderItem: (
        result: TypeaheadDataSourceEntry<T>,
        isHighlighted: boolean,
      ) => ReactNode;
      setHighlighted: (index: number) => void;
    },
  ) => ReactNode;
  resultClassName?: string;
}) {
  const [_results, setResults] = useState<
    ReadonlyArray<TypeaheadDataSourceEntry<T>>
  >([]);
  const results = useMemo(
    () => _results.filter((result) => !ignoreList?.has(result.value)),
    [_results, ignoreList],
  );

  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const input = useRef<HTMLInputElement>();

  const resetResults = useCallback(() => {
    setResults(emptySuggestions?.length ? emptySuggestions : []);
  }, [emptySuggestions]);

  const onFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      event.target.select();
      if (event.target.value) {
        dataSource.query(event.target.value);
      } else {
        resetResults();
      }
    },
    [dataSource, resetResults],
  );

  const hide = useCallback(() => {
    setHighlightedIndex(-1);
    setResults([]);
  }, []);

  const onInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      dataSource.query(event.target.value),
    [dataSource],
  );

  const handleSelection = useCallback(
    (result: TypeaheadDataSourceEntry<T>) => {
      if (!result) {
        return;
      }
      if (input.current) {
        const value = onSelect?.(result);
        input.current.value = value === '' ? '' : value || result.text;
        input.current.focus();
        resetResults();
      }
    },
    [onSelect, resetResults],
  );

  useInput(
    'cancel',
    useCallback(() => {
      if (input.current) {
        input.current.value = '';
      }
      hide();
      (document.activeElement as HTMLInputElement)?.blur?.();
    }, [hide]),
    'dialog',
  );

  const select = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    const index = highlightedIndex;
    handleSelection(results[index]);
  }, [handleSelection, highlightedIndex, results]);

  const down = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    let index = highlightedIndex;
    if (++index > results.length - 1) {
      index = 0;
    }
    setHighlightedIndex(index);
  }, [highlightedIndex, results.length]);

  const up = useCallback(() => {
    if (results.length === 0) {
      return;
    }

    let index = highlightedIndex;
    if (--index < 0) {
      index = results.length - 1;
    }
    setHighlightedIndex(index);
  }, [highlightedIndex, results.length]);

  useInput('accept', select, 'dialog');
  useDirectionalNavigation(
    useCallback(
      (change) => {
        if (change === -1) {
          up();
        } else if (change === 1) {
          down();
        }
        return false;
      },
      [down, up],
    ),
    'dialog',
  );

  const onKeydown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace' && input.current?.value === '') {
        onBackspace?.();
        return;
      }

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          down();
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          up();
          break;
        }
        case 'Enter': {
          event.preventDefault();
          select();
          break;
        }
        default:
          break;
      }
    },
    [down, onBackspace, select, up],
  );

  useEffect(() => {
    const queryCallback = (
      value: string,
      results: ReadonlyArray<TypeaheadDataSourceEntry<T>>,
    ) => {
      const currentValue = input.current?.value || '';
      if (
        document.activeElement !== input.current ||
        !input.current ||
        (currentValue === '' && results.length > 0)
      ) {
        return;
      }

      if (
        freeform &&
        currentValue &&
        !ignoreList?.has(currentValue) &&
        !results.some(({ value }) => value === currentValue)
      ) {
        const entry = new TypeaheadDataSourceEntry<T>(
          currentValue,
          currentValue,
          currentValue as T,
        );
        results = [entry, ...results];
      }

      setResults(results);
      setHighlightedIndex(0);
    };

    const onClick = (event: MouseEvent) => {
      if (
        document.activeElement !== input.current &&
        !(event.target as HTMLElement | undefined)?.closest(
          `.${containerStyle}`,
        )
      ) {
        hide();
      }
    };

    dataSource.addQueryCallback(queryCallback);
    if (autoHide) {
      document.addEventListener('click', onClick, true);
    }
    return () => {
      dataSource.removeQueryCallback(queryCallback);
      if (autoHide) {
        document.removeEventListener('click', onClick, true);
      }
    };
  }, [autoHide, dataSource, freeform, hide, ignoreList]);

  useEffect(() => {
    if (input.current && initialValue) {
      input.current.value = initialValue;
    }
  }, [initialValue]);

  return (
    <div className={containerStyle}>
      <input
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        autoFocus={autoFocus}
        className={cx(inputStyle, inputClassName)}
        onFocus={onFocus}
        onInput={onInput}
        onKeyDown={onKeydown}
        placeholder={placeholder}
        ref={(element: HTMLInputElement) => {
          input.current = element;
          if (inputRef) {
            inputRef.current = element;
          }
        }}
        spellCheck="false"
        type="text"
      />
      {results.length
        ? (
            renderResults ||
            ((
              results,
              { isHighlighted, onSelect, renderItem, setHighlighted },
            ) => (
              <ul
                className={cx(BoxStyle, resultStyle, resultClassName)}
                onPointerLeave={() => setHighlighted(-1)}
              >
                {results.map((result, index) => (
                  <li
                    className={cx(
                      resultItemStyle,
                      ellipsis,
                      isHighlighted(index) ? resultSelectedStyle : undefined,
                    )}
                    key={result.value}
                    onClick={() => onSelect(result)}
                    onPointerEnter={() => setHighlighted(index)}
                  >
                    {renderItem(result, isHighlighted(index))}
                  </li>
                ))}
              </ul>
            ))
          )(results, {
            isHighlighted: (index: number) => index === highlightedIndex,
            onSelect: handleSelection,
            renderItem,
            setHighlighted: setHighlightedIndex,
          })
        : null}
    </div>
  );
}

const containerStyle = css`
  position: relative;
  width: 100%;
`;

const inputStyle = css`
  margin: 0;
  width: 100%;
`;

const resultStyle = css`
  backdrop-filter: blur(4px);
  filter: drop-shadow(0 2px 6px ${applyVar('border-color-light')});
  left: 0;
  position: absolute;
  right: 0;
  z-index: 101;
`;

const resultItemStyle = css`
  ${clipBorder()}
  cursor: pointer;
  display: block;
  padding: 8px;
  transition: transform 150ms ease;

  border-bottom: 1px solid ${applyVar('border-color-light')};

  &:last-child {
    border-bottom: none;
  }
`;

const resultSelectedStyle = css`
  background: ${applyVar('background-color-active')};
  color: ${applyVar('text-color-bright')};
  text-shadow: rgba(0, 0, 0, 0.5) 1px 1px 0;
`;
