import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { DragEvent, ReactNode, useCallback, useRef, useState } from 'react';
import safeParse from '../lib/safeParse.tsx';

const prevent = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

export default function FileDropZone<T>({
  accept = '.json,application/json',
  label,
  onDrop,
  onError,
}: {
  accept?: string;
  label: ReactNode;
  onDrop: (data: T) => void;
  onError: (type: 'invalid-file-type' | 'invalid-file') => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlight, setHighlight] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) {
        return;
      }

      const isValidFile =
        file.type === 'application/json' ||
        accept
          .split(',')
          .some((part) => file.name.toLowerCase().endsWith(part));

      if (!isValidFile) {
        onError('invalid-file-type');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          onError('invalid-file');
          return;
        }

        const data = safeParse<T>(result);
        if (data) {
          onDrop(data);
        } else {
          onError('invalid-file');
        }
      };
      reader.readAsText(file, 'utf8');
    },
    [accept, onDrop, onError],
  );

  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    prevent(event);
    setHighlight(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    prevent(event);
    setHighlight(false);
  }, []);

  const onDropEvent = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      prevent(event);
      setHighlight(false);
      handleFile(event.dataTransfer.files[0]);
    },
    [handleFile],
  );

  return (
    <Stack
      alignCenter
      center
      className={cx(dropZoneStyle, highlight && highlightStyle)}
      onClick={() => inputRef.current?.click()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={prevent}
      onDrop={onDropEvent}
    >
      <p className={textStyle}>{label}</p>
      <input
        accept={accept}
        className={inputStyle}
        onChange={(event) => handleFile(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
    </Stack>
  );
}

const dropZoneStyle = css`
  border: 3px dashed ${applyVar('text-color-light')};
  color: ${applyVar('text-color-light')};
  cursor: pointer;
  padding: ${TileSize / 2}px;
  text-align: center;
  transition:
    background 300ms ease,
    border 300ms ease,
    color 300ms ease;
`;

const highlightStyle = css`
  background: ${getColor('blue', 0.1)};
  border-color: ${getColor('blue')};
  color: ${applyVar('text-color')};
`;

const textStyle = css`
  pointer-events: none;
`;

const inputStyle = css`
  display: none;
`;
