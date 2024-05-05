import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';

export default function getTagColor(tag: string) {
  return ((Array.from(tag)
    .map((character) => character.codePointAt(0) || 0)
    .reduce((a, b) => a + b, 0) %
    (PlayerIDs.length - 1)) +
    1) as PlayerID;
}
