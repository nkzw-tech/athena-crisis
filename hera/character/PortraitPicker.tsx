import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import {
  numberToPlayerID,
  PlayerID,
  PlayerIDs,
} from '@deities/athena/map/Player.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import useScrollIntoView from '@deities/ui/hooks/useScrollIntoView.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { memo, useCallback, useMemo, useRef } from 'react';
import useColumns from '../editor/hooks/useColumns.tsx';
import useGridNavigation from '../hooks/useGridNavigation.tsx';
import navigate from '../lib/navigate.tsx';
import PlayerIcon from '../ui/PlayerIcon.tsx';
import Portrait from './Portrait.tsx';

export type CharacterImage = Readonly<{
  color: number;
  unitId: number;
  variant: number;
}>;

const PortraitItem = ({
  character,
  color,
  onSelect,
  unit,
  variant,
}: {
  character: CharacterImage;
  color: PlayerID;
  onSelect: (character: CharacterImage) => void;
  unit: UnitInfo;
  variant: number;
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const isSelected =
    unit.id === character.unitId && variant === character.variant;

  useScrollIntoView(ref, isSelected);

  return (
    <a
      className={cx(
        SquareButtonStyle,
        isSelected ? selectedPortraitStyle : null,
      )}
      onClick={() => onSelect({ color, unitId: unit.id, variant })}
      ref={ref}
    >
      <Portrait
        animate
        clip={!isSelected}
        player={color}
        unit={unit}
        variant={variant}
      />
    </a>
  );
};

export default memo(function PortraitPicker({
  character,
  onSelect,
  portraits: initialPortraits,
}: {
  character: CharacterImage;
  onSelect: (character: CharacterImage) => void;
  portraits: ReadonlySet<UnitInfo>;
}) {
  const color = PlayerIDs.includes(character.color as PlayerID)
    ? (character.color as PlayerID)
    : 1;

  const [setRef, getColumns] = useColumns(':scope > a');

  const portraits = useMemo(
    () =>
      [...initialPortraits].flatMap((unit) =>
        ([0, 1, 2] as const).map((variant) => [unit, variant] as const),
      ),
    [initialPortraits],
  );

  useInput(
    'next',
    useCallback(() => {
      onSelect({
        ...character,
        color: color === PlayerIDs.at(-1) ? 0 : numberToPlayerID(color),
      });
    }, [character, color, onSelect]),
  );

  useInput(
    'previous',
    useCallback(() => {
      onSelect({
        ...character,
        color:
          color === 0
            ? PlayerIDs.at(-1)!
            : color === 1
              ? 0
              : numberToPlayerID(color - 2),
      });
    }, [character, color, onSelect]),
  );

  useGridNavigation(
    'navigate',
    useCallback(
      (direction) => {
        const columns = getColumns();
        if (columns == null) {
          return;
        }

        const index = portraits.findIndex(
          ([unit, variant]) =>
            unit.id === character.unitId && variant === character.variant,
        );
        navigate(direction, columns, index, portraits, [
          (index: number) => {
            const [unit, variant] = portraits[index];
            onSelect({ color, unitId: unit.id, variant });
          },
        ]);
      },
      [
        getColumns,
        portraits,
        character.unitId,
        character.variant,
        onSelect,
        color,
      ],
    ),
  );

  return (
    <>
      <Stack center gap={16}>
        {PlayerIDs.map((id) => (
          <PlayerIcon
            id={id}
            key={id}
            onClick={() => onSelect({ ...character, color: id })}
            selected={character.color === id}
          />
        ))}
      </Stack>
      <Stack gap ref={setRef} start>
        {portraits.map(([unit, variant]) => (
          <PortraitItem
            character={character}
            color={color}
            key={`${unit.id}-${variant}`}
            onSelect={onSelect}
            unit={unit}
            variant={variant}
          />
        ))}
      </Stack>
    </>
  );
});

const selectedPortraitStyle = css`
  ${pixelBorder(applyVar('text-color'))}
  width: fit-content;
`;
