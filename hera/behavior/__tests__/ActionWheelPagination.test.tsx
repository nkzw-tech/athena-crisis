import { Factory, filterBuildings, ResearchLab } from '@deities/athena/info/Building.tsx';
import { getSkillConfig, Skill, Skills } from '@deities/athena/info/Skill.tsx';
import { Plain, RailTrack } from '@deities/athena/info/Tile.tsx';
import { Infantry, Mammoth, Pioneer } from '@deities/athena/info/Unit.tsx';
import getBuildableUnits from '@deities/athena/lib/getBuildableUnits.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import sortBy from '@nkzw/core/sortBy.js';
import { setupLocaleContext } from 'fbtee';
import { ComponentProps, isValidElement, ReactElement } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import type { Actions, State } from '../../Types.tsx';
import ActionWheel, { LargeActionButton } from '../../ui/ActionWheel.tsx';
import PaginatedActionWheel from '../../ui/PaginatedActionWheel.tsx';
import BuySkills from '../BuySkills.tsx';
import CreateBuilding from '../CreateBuilding.tsx';
import CreateUnit from '../CreateUnit.tsx';

const harness = vi.hoisted(() => ({ cursor: 0 }));

vi.mock('react', async () => ({
  ...(await vi.importActual('react')),
  useCallback: (callback: unknown) => callback,
  useState: () => [
    harness.cursor,
    (value: number | ((cursor: number) => number)) => {
      harness.cursor = typeof value === 'function' ? value(harness.cursor) : value;
    },
  ],
}));
vi.mock('@deities/ui/controls/useInput.tsx', () => ({ default: vi.fn() }));
vi.mock('@deities/ui/AudioPlayer.tsx', () => ({ default: { playSound: vi.fn() } }));
// Allow more building choices than a single terrain type currently offers.
vi.mock('@deities/athena/lib/canBuild.tsx', () => ({ default: () => true }));
vi.mock('../../Building.tsx', () => ({ default: () => null }));
vi.mock('../../Medal.tsx', () => ({ default: () => null }));
vi.mock('../../Unit.tsx', () => ({ default: () => null }));
vi.mock('../../Radius.tsx', () => ({ RadiusType: { Move: 11 } }));
vi.mock('../../ui/ActionWheel.tsx', () => ({
  ActionWheelFunds: () => null,
  actionWheelInfoIconStyle: '',
  default: () => null,
  LargeActionButton: () => null,
}));
vi.mock('../../ui/FlashFlyout.tsx', () => ({ default: () => null }));
vi.mock('../../ui/Flyout.tsx', () => ({ FlyoutItem: () => null }));
vi.mock('../../ui/SkillDialog.tsx', () => ({ SkillIcon: () => null }));
vi.mock('../swap/TeleportIndicator.tsx', () => ({ default: () => null }));

setupLocaleContext({
  availableLanguages: new Map(),
  clientLocales: [],
  loadLocale: () => Promise.resolve({}),
  translations: {},
});

beforeEach(() => {
  harness.cursor = 0;
});

type Wheel = ReactElement<ComponentProps<typeof ActionWheel>>;
type Button = ReactElement<ComponentProps<typeof LargeActionButton>>;

const renderWheel = (render: () => ReactElement | null) => {
  let element = render()!;
  if (element.type !== ActionWheel) {
    element = (element.type as (props: unknown) => Wheel)(element.props);
  }
  const wheel = element as Wheel;
  const buttons = [wheel.props.children]
    .flat(Number.POSITIVE_INFINITY)
    .filter((child): child is Button => isValidElement(child) && child.type === LargeActionButton);
  const items = buttons.filter(({ props }) => props.label !== null);
  const navigation = buttons.find(({ props }) => props.label === null);
  expect(wheel.props.entityCount).toBe(buttons.length);
  expect(buttons.length).toBeLessThanOrEqual(8);
  buttons.forEach(({ props }, position) => {
    expect(props.position).toBe(position);
    expect(props.entityCount).toBe(buttons.length);
  });
  return { items, navigation };
};

const expectAllPages = (render: () => ReactElement | null, expected: ReadonlyArray<string>) => {
  const pageCount = expected.length > 8 ? Math.ceil(expected.length / 7) : 1;
  const seen: Array<string> = [];
  for (let page = 0; page < pageCount; page++) {
    const { items, navigation } = renderWheel(render);
    seen.push(...items.map(({ key }) => String(key)));
    if (pageCount > 1) {
      expect(navigation).toBeDefined();
      expect(String(navigation!.props.detail)).toBe(page === pageCount - 1 ? 'Back' : 'More');
      navigation!.props.onClick();
    } else {
      expect(navigation).toBeUndefined();
    }
  }
  expect(seen).toEqual(expected);
  expect(renderWheel(render).items.map(({ key }) => String(key))).toEqual(
    expected.slice(0, expected.length > 8 ? 7 : 8),
  );
};

const createState = () => {
  const position = vec(2, 2);
  const map = MapData.createMap({
    map: Array(9).fill([Plain.id, RailTrack.id]),
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          {
            funds: 100_000,
            id: 1,
            skills: [
              Skill.BuyUnitCannon,
              Skill.BuyUnitSuperAPU,
              Skill.BuyUnitSuperTank,
              Skill.BuyUnitHumveeAvenger,
            ],
            userId: '1',
          },
        ],
      },
      { id: 2, name: '', players: [{ funds: 0, id: 2, userId: '2' }] },
    ],
    units: [
      [2, 2, Pioneer.create(1).toJSON()],
      [1, 1, Infantry.create(2).toJSON()],
    ],
  });
  return {
    currentViewer: 1,
    map,
    playerDetails: new Map(),
    selectedBuilding: Factory.create(1),
    selectedPosition: position,
    selectedUnit: map.units.get(position),
  } as unknown as State;
};

test('unit production exposes all 15 rail-access Factory units, including Mammoth', () => {
  const state = createState();
  const behavior = new CreateUnit();
  const units = sortBy(
    getBuildableUnits(state.map, state.selectedBuilding!, state.selectedPosition!),
    (unit) => unit.getCostFor(state.map.getCurrentPlayer()),
  );
  expect(units).toHaveLength(15);
  expect(units.at(-1)).toBe(Mammoth);
  expectAllPages(
    () => behavior.component({ actions: {} as Actions, state: { ...state, behavior } }),
    units.map(({ id }) => String(id)),
  );
});

test('the last-page unit opens its deployment selection', () => {
  const state = createState();
  const behavior = new CreateUnit();
  const update = vi.fn();
  const render = () =>
    behavior.component({
      actions: { update } as unknown as Actions,
      state: { ...state, behavior },
    });
  renderWheel(render).navigation!.props.onClick();
  renderWheel(render).navigation!.props.onClick();
  const { items } = renderWheel(render);
  expect(items).toHaveLength(1);
  expect(items[0].key).toBe(String(Mammoth.id));
  expect(items[0].props.disabled).toBe(false);

  items[0].props.onClick();

  expect(update).toHaveBeenCalledOnce();
  expect(update.mock.calls[0][0]).toMatchObject({
    behavior: { type: 'createUnit' },
    radius: { fields: expect.any(Map) },
  });
  expect(update.mock.calls[0][0].radius.fields.size).toBeGreaterThan(0);
});

test('skill purchases expose every available skill across more than two pages', () => {
  const state = createState();
  const skills = sortBy(
    [...Skills].filter((skill) => {
      const { cost } = getSkillConfig(skill);
      return cost != null && cost > 0 && cost < Number.POSITIVE_INFINITY;
    }),
    (skill) => getSkillConfig(skill).cost!,
  );
  expect(skills.length).toBeGreaterThan(14);
  const behavior = new BuySkills();
  expectAllPages(
    () =>
      behavior.component({
        actions: {} as Actions,
        state: { ...state, selectedBuilding: ResearchLab.create(1).withSkills(new Set(skills)) },
      }),
    skills.map(String),
  );
});

test('building creation paginates all choices within the controller wheel capacity', () => {
  const state = createState();
  const player = state.map.getCurrentPlayer();
  const buildings = sortBy(
    filterBuildings((building) => building.getCostFor(player) < Number.POSITIVE_INFINITY),
    (building) => building.getCostFor(player),
  );
  expect(buildings.length).toBeGreaterThan(8);
  expectAllPages(
    () => new CreateBuilding().component({ actions: {} as Actions, state }),
    buildings.map(({ id }) => String(id)),
  );
});

test.each([0, 1, 7, 8, 9, 14, 15, 21, 22, 100])(
  'paginates %i items without gaps or duplicates',
  (count) => {
    const items = Array.from({ length: count }, (_, index) => String(index));
    const state = createState();
    expectAllPages(
      () =>
        PaginatedActionWheel({
          actions: {} as Actions,
          children: (item, position, entityCount) => (
            <LargeActionButton
              detail={null}
              entityCount={entityCount}
              icon={() => null}
              key={item}
              label={item}
              navigationDirection={null}
              onClick={() => {}}
              position={position}
            />
          ),
          color: 1,
          funds: 0,
          items,
          navigationDirection: null,
          position: state.selectedPosition!,
          tileSize: 24,
          zIndex: 1,
        }),
      items,
    );
  },
);
