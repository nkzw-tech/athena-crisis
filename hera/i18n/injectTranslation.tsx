import { getAllUnits, UnitInfo } from '@deities/athena/info/Unit.tsx';

type FieldMap = Readonly<{
  characterDescription: string;
  description: string;
  name: string;
}>;

type InternalField<T extends keyof FieldMap> = `internal${Capitalize<T>}`;

export default function injectTranslation<
  T extends keyof FieldMap,
  S extends InternalField<T>,
  Prototype extends { [K in T]?: string },
>(
  object: {
    prototype: Prototype;
  },
  entityMap: Record<string, () => string>,
  fields?: [T, S],
) {
  const [fieldName, internalFieldName] = fields || [
    'name' as T,
    'internalName' as S,
  ];
  const isDescription =
    fieldName === 'description' || fieldName === 'characterDescription';

  Object.defineProperty(object.prototype, fieldName, {
    configurable: true,
    get(
      this: Prototype & { [L in S]?: string } & {
        id: number;
      },
    ) {
      const value = isDescription ? String(this.id) : this[internalFieldName];
      const name =
        (value && entityMap[value]) || (() => this[internalFieldName]);
      Object.defineProperty(this, fieldName, {
        configurable: true,
        get: name,
      });
      return name();
    },
  });
}

export function injectCharacterNameTranslation<
  Prototype extends Omit<UnitInfo, 'internalCharacterName'> & {
    internalCharacterName: string;
  },
>(
  object: {
    prototype: UnitInfo;
  },
  entityMap: Record<string, () => string>,
) {
  for (const unit of getAllUnits()) {
    unit.removeCustomCharacterName();
  }

  Object.defineProperty(object.prototype, 'characterName', {
    configurable: true,
    get(this: Prototype) {
      const maybeName = entityMap[this.internalCharacterName];
      const name = maybeName ? maybeName() : this.internalCharacterName;
      this.setCharacterName(name);
      return name;
    },
  });
}
