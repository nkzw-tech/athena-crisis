import { Airfield, ConstructionSite } from '@deities/athena/info/Tile.tsx';
import { Modifier } from '@deities/athena/lib/Modifier.tsx';
import vec from '@deities/athena/map/vec.tsx';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import TileDecorator from '../TileDecorator.tsx';

vi.mock('../Tick.tsx', () => ({
  default: { vars: { apply: () => 'var(--tile-decorator-frame)' } },
}));

test.each([
  [24, 24, 3, 24, 48, 27],
  [32, 24, 3, 36, 72, 27],
  [32, 32, 5, 32, 64, 37],
])('uses a %ipx grid with a %ipx decorator sheet', (tileSize, frameSize, overlap, x, y, height) => {
  const markup = renderToStaticMarkup(
    <TileDecorator
      modifier={Modifier.Variant3}
      position={vec(2, 3)}
      sprite={{
        anchor: { x: frameSize / 2, y: frameSize },
        frameSize,
        image: `/decorators-${frameSize}.png`,
        overlap,
      }}
      tile={ConstructionSite}
      tileSize={tileSize}
    />,
  );
  expect(markup).toContain(`/decorators-${frameSize}.png`);
  expect(markup).toContain(`background-position-x:${-2 * frameSize}px`);
  expect(markup).toContain('background-position-y:0px');
  expect(markup).toContain(`height:${height}px`);
  expect(markup).toContain(`width:${frameSize}px`);
  expect(markup).toContain(`translate3d(${x}px, ${y}px, 0)`);
});

test('animation rows use the selected sheet frame size', () => {
  const markup = renderToStaticMarkup(
    <TileDecorator
      modifier={0}
      sprite={{
        anchor: { x: 16, y: 32 },
        frameSize: 32,
        image: '/decorators-32.png',
        overlap: 3,
      }}
      tile={Airfield}
      tileSize={32}
    />,
  );
  expect(markup).toContain('background-position-x:-256px');
  expect(markup).toContain('background-position-y:calc(var(--tile-decorator-frame) * -32px)');
});
