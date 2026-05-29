import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { useOptionalInput } from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import InlineLink, { InlineLinkColor } from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import { css, cx } from '@emotion/css';
import Stack from '@nkzw/stack';
import { ReactNode, useCallback, useMemo } from 'react';

type AISelectorEntry = Readonly<{
  description: ReactNode;
  name: ReactNode;
}>;

type AISelectorRegistry = ReadonlyMap<number, AISelectorEntry>;

function AISelectorItem({ description, name }: AISelectorEntry) {
  return (
    <span className={itemStyle}>
      <span>{name}</span>
      <span className={cx(InlineLinkColor, descriptionStyle)}>{description}</span>
    </span>
  );
}

export default function AISelector({
  allowDefaultAI,
  currentAI,
  isFocused,
  registry,
  setAI,
}: {
  allowDefaultAI?: boolean;
  currentAI: number | undefined;
  isFocused?: boolean;
  registry: AISelectorRegistry;
  setAI: (id: number | null) => void;
}) {
  const defaultEntry = useMemo(
    () => ({
      description: <fbt desc="Description for automatically selecting an AI">Automatic</fbt>,
      name: <fbt desc="Default AI selector option">Default</fbt>,
    }),
    [],
  );
  const entries = useMemo(
    () =>
      [...(allowDefaultAI ? ([[null, defaultEntry]] as const) : []), ...registry] as ReadonlyArray<
        readonly [number | null, AISelectorEntry]
      >,
    [allowDefaultAI, defaultEntry, registry],
  );
  const currentID = allowDefaultAI ? (currentAI ?? null) : (currentAI ?? 0);
  const currentIndex = Math.max(
    0,
    entries.findIndex(([id]) => id === currentID),
  );
  const currentEntry =
    allowDefaultAI && currentAI == null
      ? defaultEntry
      : (currentAI != null ? registry.get(currentAI) : registry.get(0))!;

  const cycleAI = useCallback(
    (change: -1 | 1) => {
      const nextEntry = entries.at((currentIndex + change + entries.length) % entries.length);
      if (nextEntry) {
        AudioPlayer.playSound(change === 1 ? 'UI/Next' : 'UI/Previous');
        setAI(nextEntry[0]);
      }
    },
    [currentIndex, entries, setAI],
  );

  useOptionalInput(
    'previous',
    useCallback(
      (event) => {
        event.preventDefault();
        cycleAI(-1);
      },
      [cycleAI],
    ),
    !!isFocused && entries.length > 1,
    'top',
  );
  useOptionalInput(
    'next',
    useCallback(
      (event) => {
        event.preventDefault();
        cycleAI(1);
      },
      [cycleAI],
    ),
    !!isFocused && entries.length > 1,
    'top',
  );

  return (
    <Stack alignCenter between gap={16}>
      <fbt desc="Label to pick an AI">AI:</fbt>
      <Select
        dropdownClassName={dropdownStyle}
        outline={isFocused ? true : undefined}
        selectedItem={<AISelectorItem {...currentEntry} />}
      >
        {allowDefaultAI && (
          <InlineLink
            className={optionStyle}
            onClick={() => setAI(null)}
            selectedText={currentAI == null}
          >
            <AISelectorItem {...defaultEntry} />
          </InlineLink>
        )}
        {[...registry].map(([id, entry]) => (
          <InlineLink
            className={optionStyle}
            key={id}
            onClick={() => setAI(id)}
            selectedText={id === (allowDefaultAI ? currentAI : (currentAI ?? 0))}
          >
            <AISelectorItem {...entry} />
          </InlineLink>
        ))}
      </Select>
    </Stack>
  );
}

const itemStyle = css`
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-width: 0;
  width: 100%;
`;

const dropdownStyle = css`
  min-width: max(100%, 280px);
  width: 100%;
`;

const optionStyle = css`
  min-width: max-content;
  width: 100%;
`;

const descriptionStyle = css`
  color: ${applyVar('text-color-light')};
`;
