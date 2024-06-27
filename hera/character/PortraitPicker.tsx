import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import PlayerIcon from '../ui/PlayerIcon.tsx';
import Portrait from './Portrait.tsx';

export type CharacterImage = Readonly<{
  color: number;
  unitId: number;
  variant: number;
}>;

export default memo(function PortraitPicker({
  character,
  onSelect,
  portraits,
}: {
  character: CharacterImage;
  onSelect: (character: CharacterImage) => void;
  portraits: ReadonlySet<UnitInfo>;
}) {
  const color =
    PlayerIDs.includes(character.color as PlayerID) && character.color > 0
      ? (character.color as PlayerID)
      : 1;
  return (
    <>
      <Stack center gap={16}>
        {PlayerIDs.filter((id) => id > 0).map((id) => (
          <PlayerIcon
            id={id}
            key={id}
            onClick={() => onSelect({ ...character, color: id })}
            selected={character.color === id}
          />
        ))}
      </Stack>
      <Stack center gap>
        {[...portraits].flatMap((unit) =>
          ([0, 1, 2] as const).map((variant) => {
            const isSelected =
              unit.id === character.unitId && variant === character.variant;
            return (
              <a
                className={cx(
                  SquareButtonStyle,
                  isSelected ? selectedPortraitStyle : null,
                )}
                key={`${unit.id}-${variant}`}
                onClick={() => onSelect({ color, unitId: unit.id, variant })}
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
          }),
        )}
      </Stack>
    </>
  );
});

const selectedPortraitStyle = css`
  ${pixelBorder(applyVar('text-color'))}
  width: fit-content;
`;
