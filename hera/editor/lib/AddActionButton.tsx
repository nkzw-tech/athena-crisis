import { Action } from '@deities/apollo/Action.tsx';
import { EffectTrigger } from '@deities/apollo/Effects.tsx';
import { MinFunds } from '@deities/athena/info/Building.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Select from '@deities/ui/Select.tsx';
import { css } from '@emotion/css';
import ImmutableMap from '@nkzw/immutable-map';

export default function AddActionButton({
  isAdmin,
  onSelect,
  trigger,
}: {
  isAdmin: boolean;
  onSelect: (action: Action) => void;
  trigger: EffectTrigger;
}) {
  return (
    <Select
      selectedItem={
        <div className={addStyle}>
          <fbt desc="Dropdown to add a new effect">Add Action</fbt>
        </div>
      }
    >
      {trigger !== 'GameEnd' ? (
        <>
          <InlineLink
            onClick={() =>
              onSelect({
                type: 'SpawnEffect',
                units: ImmutableMap(),
              })
            }
          >
            <fbt desc="Button to add a new spawn effect in the map editor">
              Spawn Effect
            </fbt>
          </InlineLink>
          <InlineLink
            onClick={() =>
              onSelect({
                funds: MinFunds,
                player: 'self',
                type: 'IncreaseFundsEffect',
              })
            }
          >
            <fbt desc="Button to add a new increase funds effect in the map editor">
              Increase Funds Effect
            </fbt>
          </InlineLink>
          <InlineLink
            onClick={() =>
              onSelect({
                charges: 1,
                player: 'self',
                type: 'IncreaseChargeEffect',
              })
            }
          >
            <fbt desc="Button to add a new increase charge effect in the map editor">
              Increase Charge Effect
            </fbt>
          </InlineLink>
        </>
      ) : null}
      {isAdmin ? (
        <InlineLink
          onClick={() =>
            onSelect({
              crystal: Crystal.Memory,
              type: 'ActivateCrystal',
            })
          }
        >
          <fbt desc="Button to add a new crystal effect in the map editor">
            Activate Crystal Effect
          </fbt>
        </InlineLink>
      ) : null}
    </Select>
  );
}

const addStyle = css`
  color: ${applyVar('highlight-color')};
`;
