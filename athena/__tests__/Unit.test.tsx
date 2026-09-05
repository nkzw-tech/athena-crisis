import { expect, test } from 'vitest';
import { Infantry } from '../info/Unit.tsx';
import Unit, { ShieldType } from '../map/Unit.tsx';

test.each([null, ShieldType.Temporary, ShieldType.Persistent])(
  'preserves shield type %s when copying and serializing units',
  (shield) => {
    const unit = Infantry.create(1).copy({ shield });
    const json = unit.toJSON();

    expect(json.d).toBe(shield ?? undefined);
    expect(Unit.fromJSON(json).shield).toBe(shield);
    expect(Unit.fromJSON(json).toJSON()).toEqual(json);
    expect(unit.setHealth(50).shield).toBe(shield);
  },
);

test('reads existing shield data as temporary', () => {
  const json = Infantry.create(1).toJSON();
  expect(Unit.fromJSON({ ...json, d: 1 }).shield).toBe(ShieldType.Temporary);
  expect(Unit.fromJSON(json).shield).toBeNull();
});

test('activating shields upgrades temporary shields and preserves persistent shields', () => {
  const temporary = Infantry.create(1).activateShield(ShieldType.Temporary);
  const persistent = temporary.activateShield(ShieldType.Persistent);

  expect(temporary.shield).toBe(ShieldType.Temporary);
  expect(persistent.shield).toBe(ShieldType.Persistent);
  expect(persistent.activateShield(ShieldType.Temporary)).toBe(persistent);
  expect(persistent.deactivateShield().shield).toBeNull();
});
