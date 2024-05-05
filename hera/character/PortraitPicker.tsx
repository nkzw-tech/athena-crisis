import { InitialAvailablePortraits } from '@deities/athena/info/Unit.tsx';
import { numberToPlayerID } from '@deities/athena/map/Player.tsx';
import { ButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import Portrait from './Portrait.tsx';

export type CharacterImage = Readonly<{
  unitId: number;
  variant: number;
}>;

export default memo(function PortraitPicker({
  character,
  selectCharacter,
}: {
  character: CharacterImage;
  selectCharacter: (character: CharacterImage) => void;
}) {
  let player = 0;
  return (
    <Stack gap={16} vertical>
      {[...InitialAvailablePortraits].map((unit) => (
        <Stack gap={16} key={unit.id} nowrap start>
          {([0, 1, 2] as const).map((variant) => {
            const isSelected =
              unit.id === character.unitId && variant === character.variant;
            return (
              <a
                className={cx(
                  ButtonStyle,
                  isSelected ? selectedPortraitStyle : null,
                )}
                key={variant}
                onClick={() => selectCharacter({ unitId: unit.id, variant })}
              >
                <Portrait
                  animate
                  clip={!isSelected}
                  player={numberToPlayerID(player++)}
                  unit={unit}
                  variant={variant}
                />
              </a>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
});

const selectedPortraitStyle = css`
  ${pixelBorder(applyVar('text-color'))}
  width: fit-content;
`;
