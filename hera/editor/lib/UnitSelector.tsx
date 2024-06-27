import {
  mapUnits,
  mapUnitsWithContentRestriction,
  UnitInfo,
} from '@deities/athena/info/Unit.tsx';
import {
  DynamicPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import Portrait from '../../character/Portrait.tsx';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';

export default memo(function UnitSelector({
  currentPlayer,
  hasContentRestrictions,
  isVisible,
  map,
  onSelect,
  selectedPlayer,
  selectedUnit,
  user,
}: {
  currentPlayer?: PlayerID;
  hasContentRestrictions: boolean;
  isVisible: boolean;
  map?: MapData;
  onSelect?: (unit: UnitInfo) => void;
  selectedPlayer: DynamicPlayerID;
  selectedUnit: UnitInfo;
  user: UserWithFactionNameAndSkills | null;
}) {
  const shouldRenderControls = isVisible && onSelect;
  const hasCurrentPlayer = map && currentPlayer != null;
  const player = hasCurrentPlayer
    ? resolveDynamicPlayerID(map, selectedPlayer, currentPlayer)
    : selectedPlayer;

  return (
    <Stack className={cx(selectorContainerStyle, unitContainerStyle)}>
      <span
        className={nowrapStyle}
        style={player != null ? { color: getColor(player) } : undefined}
      >
        {selectedUnit.name}
        {!hasCurrentPlayer || currentPlayer === player
          ? ` - ${selectedUnit.characterName}`
          : null}
      </span>
      {shouldRenderControls && (
        <Stack className={cx(selectorStyle, unitSelectorStyle)} nowrap vertical>
          {(hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
            (unit) => (
              <InlineLink
                className={unitStyle}
                key={unit.id}
                onClick={() => onSelect(unit)}
                selectedText={unit.id === selectedUnit.id}
              >
                <Stack alignCenter gap nowrap start>
                  <Portrait
                    clip
                    player={player}
                    scale={0.5}
                    unit={unit}
                    variant={0}
                  />
                  <div>
                    {unit.name} - {String(unit.characterName)}
                  </div>
                </Stack>
              </InlineLink>
            ),
            new Set(user?.skills),
          )}
        </Stack>
      )}
    </Stack>
  );
});

const selectorContainerStyle = css`
  cursor: pointer;
  position: relative;

  & > div {
    transition-delay: 150ms;
  }
  &:hover > div {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
    transition-delay: 0ms;
  }
`;

const selectorStyle = css`
  ${pixelBorder(applyVar('background-color'))}
  background: ${applyVar('background-color')};

  cursor: initial;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  transform: scale(0.9);
  transition:
    opacity 150ms ease,
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
`;

const unitContainerStyle = css`
  min-width: 120px;

  ${Breakpoints.sm} {
    min-width: 320px;
  }
`;

const unitSelectorStyle = css`
  left: 0;
  max-height: 300px;
  min-width: 320px;
  overflow-y: auto;
  padding: 2px;
  top: -12px;
`;

const unitStyle = css`
  image-rendering: pixelated;
  margin: 8px 0;
`;

const nowrapStyle = css`
  white-space: nowrap;
`;
