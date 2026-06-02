import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';

export default function getTagColor(tag: string, colorCount = PlayerIDs.length - 1) {
  return ((Array.from(tag)
    .map((character) => character.codePointAt(0) || 0)
    .reduce((a, b) => a + b, 0) %
    colorCount) +
    1) as PlayerID;
}
