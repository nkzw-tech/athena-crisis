import { Effect } from '@deities/apollo/Effects.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { memo } from 'react';
import ActionCard from '../editor/lib/ActionCard.tsx';
import { FactionNames } from '../Types.tsx';

export default memo(function StartDialogue({
  currentPlayer,
  effect,
  factionNames,
  map,
  userDisplayName,
}: {
  currentPlayer?: PlayerID;
  effect: Effect;
  factionNames: FactionNames;
  map: MapData;
  userDisplayName: string;
}) {
  return (
    <Stack gap={16} vertical>
      {effect.actions.map((action, index) => (
        <ActionCard
          action={action}
          biome={map.config.biome}
          currentPlayer={currentPlayer}
          factionNames={factionNames}
          formatText
          hasContentRestrictions={false}
          key={index}
          map={map}
          scrollRef={null}
          user={null}
          userDisplayName={userDisplayName}
        />
      ))}
    </Stack>
  );
});
