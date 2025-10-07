import { Effect } from '@deities/apollo/Effects.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VStack } from '@nkzw/stack';
import { memo } from 'react';
import ActionCard from '../editor/lib/ActionCard.tsx';
import { PlayerDetails } from '../Types.tsx';

export default memo(function StartDialogue({
  currentPlayer,
  effect,
  map,
  playerDetails,
  userDisplayName,
}: {
  currentPlayer?: PlayerID;
  effect: Effect;
  map: MapData;
  playerDetails: PlayerDetails;
  userDisplayName: string;
}) {
  return (
    <VStack between gap={16} wrap>
      {effect.actions.map((action, index) => (
        <ActionCard
          action={action}
          biome={map.config.biome}
          currentPlayer={currentPlayer}
          formatText
          hasContentRestrictions={false}
          key={index}
          map={map}
          playerDetails={playerDetails}
          scrollRef={null}
          user={null}
          userDisplayName={userDisplayName}
        />
      ))}
    </VStack>
  );
});
