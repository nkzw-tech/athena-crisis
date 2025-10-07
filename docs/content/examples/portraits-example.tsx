import { preparePortraits } from '@deities/art/Sprites.tsx';
import {
  BazookaBear,
  Flamethrower,
  Jetpack,
  Sniper,
} from '@deities/athena/info/Unit.tsx';
import Portrait from '@deities/hera/character/Portrait.tsx';
import Stack from '@nkzw/stack';

preparePortraits();

// [!region portraits]
const portraits = (
  <Stack between gap wrap>
    <Portrait animate player={1} unit={Sniper} variant={0} />
    <Portrait animate player={2} unit={Flamethrower} variant={2} />
    <Portrait animate player={6} unit={BazookaBear} variant={0} />
    <Portrait animate player={5} unit={Jetpack} variant={2} />
  </Stack>
);
// [!endregion portraits]

export default function PortraitsExample() {
  return portraits;
}
