import { Mountain } from '@deities/athena/info/Tile.tsx';
import { Flamethrower, Infantry } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import { Fragment, useState } from 'react';
import PlaygroundGame from '../playground/PlaygroundGame.tsx';

// [!region mapA]
const mapA = withModifiers(
  MapData.createMap({
    map: [1, 1, 1, 1, Mountain.id, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 500, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, name: 'Bot' }],
      },
    ],
  }),
);
// [!endregion mapA]

// [!region mapB]
const mapB = mapA.copy({
  units: mapA.units.set(vec(2, 1), Flamethrower.create(1)).set(vec(3, 3), Infantry.create(2)),
});
// [!endregion mapB]

export default function ExampleMap() {
  const [render, rerender] = useState(0);
  return (
    <Fragment key={render}>
      <PlaygroundGame map={mapB} />
      <InlineLink onClick={() => rerender(render + 1)}>Reset State</InlineLink>
    </Fragment>
  );
}
