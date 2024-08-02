import getFirstHumanPlayer from '@deities/athena/lib/getFirstHumanPlayer.tsx';
import isPvP from '@deities/athena/lib/isPvP.tsx';
import { PlayerID, toPlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';

const spectatorCodeToPlayerID = (spectatorCode: string) => {
  const maybePlayerID = parseInteger(spectatorCode.split('-')[0]);
  return maybePlayerID ? toPlayerID(maybePlayerID) : null;
};

export default function getClientViewer(
  map: MapData,
  currentViewer: PlayerID | null,
  spectatorCodes: ReadonlyArray<string> | undefined,
) {
  return (
    currentViewer ||
    (spectatorCodes?.length && spectatorCodeToPlayerID(spectatorCodes[0])) ||
    (!isPvP(map) && getFirstHumanPlayer(map)?.id) ||
    0
  );
}
