import { Shipyard } from '@deities/athena/info/Building.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Helicopter } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import type { Animation } from '@deities/hera/MapAnimations.tsx';
import { expect, test } from 'vitest';
import { captureOne, getRenderedMap } from '../screenshot.tsx';

const base = withModifiers(
  MapData.createMap({
    map: Array(30).fill(Plain.id),
    size: { height: 5, width: 6 },
    teams: [{ id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] }],
  }),
);
const position = vec(2, 3);
const map = base.copy({
  buildings: base.buildings.set(position, Shipyard.create(1)),
  units: base.units.set(position, Helicopter.create(1)),
});

test.each([
  ['heal', 36, -6, -10],
  ['sabotage', 42, -9, -14],
  ['spawn', 48, -12, -16],
  ['despawn', 48, -12, -16],
  ['rescue', 48, -12, -14.4],
  ['createBuilding', 48, -12, -16],
  ['explosion', 72, -24, -37.92],
  ['damage', 48, -12, -15.6],
] as const)(
  '%s keeps its native art and entity anchor',
  async (type, frameSize, offsetX, offsetY) => {
    for (const [tileSize, unitSize, buildingSize] of [
      [24, 24, 24],
      [32, 24, 24],
      [32, 20, 28],
    ]) {
      await captureOne(map, '1', { buildingSize, tileSize, unitSize });
      const rendered = getRenderedMap();
      await rendered.evaluate(async (_, type) => {
        await window.GameMapActions[0].update((state) => {
          const position = state.map.units.keys().next().value!;
          const common = {
            onComplete: () => null,
            unitDirection: 'left',
            variant: 1,
          } as const;
          const animations = {
            createBuilding: { ...common, type: 'createBuilding' },
            damage: { ...common, animation: 'power', type: 'damage' },
            despawn: { ...common, locked: false, speed: 'slow', type: 'despawn' },
            explosion: { ...common, style: 'building', type: 'explosion' },
            heal: { ...common, type: 'heal' },
            rescue: { ...common, type: 'rescue' },
            sabotage: { ...common, type: 'sabotage' },
            spawn: { ...common, locked: false, speed: 'slow', type: 'spawn' },
          } satisfies Record<typeof type, Animation>;
          return {
            animationConfig: { ...state.animationConfig, ExplosionStep: 60_000 },
            animations: state.animations.clear().set(position, animations[type]),
          };
        });
      }, type);
      const effect = rendered.locator('[style*="background-repeat: no-repeat"]');
      await effect.waitFor({ state: 'attached' });
      const layout = await effect.evaluate((element: HTMLElement) => ({
        height: Number.parseFloat(element.style.height),
        width: Number.parseFloat(element.style.width),
        x: Number.parseFloat(element.style.left),
        y: Number.parseFloat(element.style.top),
      }));
      const entitySize =
        type === 'createBuilding' || type === 'explosion' ? buildingSize : unitSize;
      expect(layout.height).toBe(frameSize);
      expect(layout.width).toBe(frameSize);
      expect(layout.x).toBeCloseTo(tileSize + (tileSize - entitySize) / 2 + offsetX);
      expect(layout.y).toBeCloseTo(tileSize * 2 + (tileSize - entitySize) / 2 + offsetY);
    }
  },
);

test.each([16, 24, 32, 64])(
  'anchors %ipx attack frames with native weapon offsets',
  async (frameSize) => {
    for (const tileSize of [24, 32]) {
      await captureOne(map, '1', { tileSize });
      const rendered = getRenderedMap();
      await rendered.evaluate(async (_, frameSize) => {
        await window.GameMapActions[0].update((state) => {
          const [position, unit] = state.map.units.entries().next().value!;
          const weapon = unit.info.attack.weapons!.values().next().value!;
          return {
            animationConfig: { ...state.animationConfig, ExplosionStep: 60_000 },
            animations: state.animations.clear().set(position, {
              direction: { direction: 'left', toJSON: () => 1 },
              hasAttackStance: false,
              onComplete: () => null,
              style: null,
              type: 'attack',
              variant: 1,
              weapon: weapon.withAnimation(
                weapon.animation.copy({
                  mirror: false,
                  positions: { horizontal: { x: 0.25, y: -0.25 } },
                  size: frameSize,
                }),
              ),
            }),
          };
        });
      }, frameSize);
      const effect = rendered.locator('[style*="background-repeat: no-repeat"]');
      await effect.waitFor({ state: 'attached' });
      const layout = await effect.evaluate((element: HTMLElement) => ({
        width: Number.parseFloat(element.style.width),
        x: Number.parseFloat(element.style.left),
        y: Number.parseFloat(element.style.top),
      }));
      expect(layout.width).toBe(frameSize);
      expect(layout.x).toBe(tileSize + (tileSize - 24) / 2 + 6 - (frameSize - 24) / 2);
      expect(layout.y).toBe(tileSize * 2 + (tileSize - 24) / 2 - 6 - (frameSize - 24));
    }
  },
);

test.each([16, 24, 25, 32, 40, 48])('the cursor surrounds a %ipx cell', async (tileSize) => {
  await captureOne(map, '1', { showCursor: true, tileSize });
  const rendered = getRenderedMap();
  await rendered.evaluate(async () => {
    await window.GameMapActions[0].update((state) => ({
      position: state.map.units.keys().next().value!,
      showCursor: true,
    }));
  });
  const cursor = await rendered.evaluate((root, tileSize) => {
    const frame = [...root.querySelectorAll<HTMLElement>('div')].find((element) =>
      getComputedStyle(element).backgroundImage.includes('Cursor'),
    )!;
    const cursor = tileSize === 24 ? frame : frame.parentElement!.parentElement!;
    cursor.dataset.testid = 'cursor-art';
    const position = new DOMMatrixReadOnly(getComputedStyle(cursor).transform);
    return {
      animations: cursor
        .getAnimations({ subtree: true })
        .filter(({ effect }) =>
          (effect as KeyframeEffect).getKeyframes().some((frame) => 'backgroundPositionX' in frame),
        ).length,
      height: cursor.offsetHeight,
      parts: [...cursor.children].map((corner) => {
        const element = corner as HTMLElement;
        return {
          height: element.offsetHeight,
          width: element.offsetWidth,
          x: element.offsetLeft,
          y: element.offsetTop,
        };
      }),
      width: cursor.offsetWidth,
      x: position.m41,
      y: position.m42,
    };
  }, tileSize);
  expect(cursor).toEqual({
    animations: tileSize === 24 ? 1 : 4,
    height: tileSize + 2,
    parts:
      tileSize === 24
        ? []
        : [
            { height: 13, width: 13, x: 0, y: 0 },
            { height: 13, width: 13, x: tileSize - 11, y: 0 },
            { height: 13, width: 13, x: 0, y: tileSize - 11 },
            { height: 13, width: 13, x: tileSize - 11, y: tileSize - 11 },
          ],
    width: tileSize + 2,
    x: tileSize - 1,
    y: tileSize * 2 - 1,
  });

  if (tileSize === 24) {
    const cursor = rendered.getByTestId('cursor-art');
    await cursor.evaluate((element) => {
      element.style.backgroundColor = 'white';
      element.style.opacity = '1';
      element.style.transition = 'none';
      const reference = document.createElement('div');
      reference.dataset.testid = 'cursor-reference';
      Object.assign(reference.style, {
        backgroundColor: 'white',
        backgroundImage: getComputedStyle(element).backgroundImage,
        height: '26px',
        imageRendering: getComputedStyle(element).imageRendering,
        left: '0px',
        position: 'fixed',
        top: '0px',
        width: '26px',
        zIndex: '9999',
      });
      document.body.append(reference);
    });
    const reference = rendered.page().getByTestId('cursor-reference');
    for (const row of [0, 26]) {
      for (const frame of [0, 1, 2, 3]) {
        await cursor.evaluate(
          (element, { frame, row }) => {
            Object.assign(element.style, {
              animation: 'none',
              backgroundPosition: `${-frame * 26}px ${-row}px`,
            });
            document.querySelector<HTMLElement>(
              '[data-testid="cursor-reference"]',
            )!.style.backgroundPosition = `${-frame * 26}px ${-row}px`;
          },
          { frame, row },
        );
        expect((await cursor.screenshot()).equals(await reference.screenshot())).toBe(true);
      }
    }
    await reference.evaluate((element) => element.remove());
  }
});

test.each([24, 32])('a %ipx cursor retains its position while fading out', async (tileSize) => {
  await captureOne(map, '1', { showCursor: true, tileSize });
  const rendered = getRenderedMap();
  await rendered.evaluate(async () => {
    await window.GameMapActions[0].update((state) => ({
      position: state.map.units.keys().next().value!,
      showCursor: true,
    }));
  });
  const getCursorStyle = () =>
    rendered.evaluate((root, tileSize) => {
      const frame = [...root.querySelectorAll<HTMLElement>('div')].find((element) =>
        getComputedStyle(element).backgroundImage.includes('Cursor'),
      )!;
      const cursor = tileSize === 24 ? frame : frame.parentElement!.parentElement!;
      return { opacity: cursor.style.opacity, transform: cursor.style.transform };
    }, tileSize);
  const initial = await getCursorStyle();
  expect(initial.opacity).toBe('1');
  await rendered.evaluate(async () => {
    await window.GameMapActions[0].update({ position: null, showCursor: true });
  });
  expect(await getCursorStyle()).toEqual({ ...initial, opacity: '0' });
  await rendered.evaluate(async () => {
    await window.GameMapActions[0].update((state) => ({
      position: state.map.units.keys().next().value!,
      showCursor: true,
    }));
  });
  expect(await getCursorStyle()).toEqual(initial);
});
