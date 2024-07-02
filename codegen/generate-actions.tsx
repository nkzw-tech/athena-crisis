#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import {
  TSType,
  TSTypeAliasDeclaration,
  TSTypeElement,
  TSTypeReference,
} from '@babel/types';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import chalk from 'chalk';
import { format } from 'prettier';
import sign from './lib/sign.tsx';
import traverse from './lib/traverse.tsx';

console.log(chalk.bold('› Generating actions...'));

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../');
const encodedActionsFileName = join(root, './apollo/EncodedActions.tsx');
const formatActionsFileName = join(root, './apollo/FormatActions.tsx');
const stableActionMapFileName = join(root, './apollo/ActionMap.json');
const stableConditionMapFileName = join(root, './apollo/ConditionMap.json');
const files = [
  './apollo/Action.tsx',
  './apollo/ActionResponse.tsx',
  './apollo/Condition.tsx',
  './apollo/Objective.tsx',
  './apollo/HiddenAction.tsx',
];

const customEncoderReferences = new Set([
  'DynamicPlayerID',
  'Reward',
  'Teams',
  'Objective',
  'DynamicEffectObjectiveID',
]);
const scalarReferences = new Set(['PlayerID', 'Skill']);
const allowedReferences = new Set([
  'AttackDirection',
  'Building',
  'DryUnit',
  'Unit',
  'Vector',
  ...customEncoderReferences,
  ...scalarReferences,
]);

type ActionType = 'action' | 'condition';
type ExtractedType = Readonly<{
  id: number;
  name: string;
  props: ReadonlyArray<Prop>;
  type: ActionType;
}>;

type Prop = Readonly<{
  name: string;
  optional: boolean;
  value: ValueType;
}>;

type ValueType = Readonly<
  | { type: 'number'; value: 'number' }
  | { type: 'boolean'; value: 'boolean' }
  | { type: 'literal'; value: string }
  | { type: 'string'; value: 'string' }
  | { type: 'reference'; value: string }
  | { type: 'entities'; value: string }
  | {
      readonly: boolean;
      type: 'array';
      value: string;
    }
  | { type: 'object'; value: ReadonlyArray<Prop> }
>;

const getShortName = (name: string) =>
  name.replace(/Action(Response)?$|Condition$/, '');

const actionMap = new Map<string, [number, Array<string>]>(
  JSON.parse(readFileSync(stableActionMapFileName, 'utf8')),
);
const conditionMap = new Map<string, [number, Array<string>]>(
  JSON.parse(readFileSync(stableConditionMapFileName, 'utf8')),
);
const getStableTypeID = (() => {
  let actionCounter = (Array.from(actionMap.values()).pop()?.[0] ?? -1) + 1;
  let conditionCounter =
    (Array.from(conditionMap.values()).pop()?.[0] ?? -1) + 1;

  return (type: ActionType, name: string) => {
    const map = type === 'action' ? actionMap : conditionMap;
    const shortName = getShortName(name);
    if (!map.has(shortName)) {
      map.set(shortName, [
        type === 'action' ? actionCounter++ : conditionCounter++,
        [],
      ]);
    }
    return map.get(shortName)![0];
  };
})();

const getStableTypeProps = (type: ActionType, name: string) =>
  (type === 'action' ? actionMap : conditionMap).get(getShortName(name))?.[1];

const isAllowedReference = (node: TSType): node is TSTypeReference =>
  node.type === 'TSTypeReference' &&
  node.typeName.type === 'Identifier' &&
  allowedReferences.has(node.typeName.name);

const getTypeAnnotation = (typeAnnotation: TSType) => {
  return typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName.type === 'Identifier' &&
    typeAnnotation.typeName.name === 'Readonly' &&
    typeAnnotation.typeParameters?.params.length
    ? typeAnnotation.typeParameters.params[0]
    : typeAnnotation;
};

const resolveValueType = (node: TSType): ValueType => {
  if (node.type === 'TSNumberKeyword') {
    return { type: 'number', value: 'number' };
  }

  if (node.type === 'TSStringKeyword') {
    return { type: 'string', value: 'string' };
  }

  if (node.type === 'TSBooleanKeyword') {
    return { type: 'boolean', value: 'boolean' };
  }

  if (node.type === 'TSLiteralType' && node.literal.type === 'StringLiteral') {
    return { type: 'literal', value: node.literal.value };
  }

  if (node.type === 'TSTypeReference' && node.typeName.type === 'Identifier') {
    if (
      node.typeName.name === 'ImmutableMap' &&
      node.typeParameters?.params.every(isAllowedReference) &&
      node.typeParameters.params[0].typeName.type === 'Identifier' &&
      node.typeParameters.params[0].typeName.name === 'Vector' &&
      node.typeParameters.params[1].typeName.type === 'Identifier'
    ) {
      return {
        type: 'entities',
        value: node.typeParameters?.params[1].typeName.name,
      };
    }

    if (allowedReferences.has(node.typeName.name)) {
      return { type: 'reference', value: node.typeName.name };
    }

    if (
      node.typeParameters &&
      node.typeParameters.type === 'TSTypeParameterInstantiation' &&
      node.typeParameters.params.length === 1
    ) {
      const parameter = node.typeParameters.params[0];
      const value =
        isAllowedReference(parameter) &&
        parameter.typeName.type === 'Identifier'
          ? parameter.typeName.name
          : parameter.type === 'TSNumberKeyword'
            ? 'number'
            : null;
      if (value) {
        return {
          readonly:
            node.typeName.type === 'Identifier' &&
            node.typeName.name === 'ReadonlyArray',
          type: 'array',
          value,
        };
      }
    }
  }

  const objectNode = getTypeAnnotation(node);
  if (objectNode.type === 'TSTypeLiteral') {
    return { type: 'object', value: objectNode.members.map(extractProp) };
  }

  throw new Error(
    `generate-actions: Invalid node type '${
      node.type
    }' with node '${JSON.stringify(node, null, 2)}'.`,
  );
};

const extractProp = (node: TSTypeElement): Prop => {
  if (
    node.type === 'TSPropertySignature' &&
    node.key.type === 'Identifier' &&
    node.typeAnnotation
  ) {
    const { typeAnnotation } = node.typeAnnotation;
    return {
      name: node.key.name,
      optional: !!node.optional,
      value: resolveValueType(typeAnnotation),
    };
  }

  throw new Error(
    `generate-actions: Could not extract member information from '${node.type}'.`,
  );
};

const extract = (
  files: ReadonlyArray<string>,
): ReadonlyArray<ExtractedType> => {
  const types: Array<ExtractedType> = [];
  files.map((file) => {
    const ast = parse(readFileSync(join(root, file), 'utf8'), {
      plugins: ['typescript', 'jsx'],
      sourceType: 'module',
    });
    traverse(ast, {
      TSTypeAliasDeclaration(path: NodePath<TSTypeAliasDeclaration>) {
        const typeAnnotation = getTypeAnnotation(path.node.typeAnnotation);
        if (typeAnnotation.type === 'TSTypeLiteral') {
          const name = path.node.id.name;
          const type = name.endsWith('Condition') ? 'condition' : 'action';
          const existingProps = getStableTypeProps(type, name);
          const unsortedProps = typeAnnotation.members.flatMap(extractProp);
          const props = existingProps?.length
            ? sortBy(unsortedProps, ({ name, optional }) => {
                const index = existingProps.indexOf(name);
                if (!optional && index === -1) {
                  throw new Error(
                    `generate-actions: Cannot add new non-optional prop '${name}' to '${path.node.id.name}' with props '${JSON.stringify(
                      unsortedProps,
                      null,
                      2,
                    )}'.`,
                  );
                }
                return index === -1 ? Number.POSITIVE_INFINITY : index;
              })
            : unsortedProps.sort(
                (
                  { name: nameA, optional: optionalA },
                  { name: nameB, optional: optionalB },
                ) => {
                  if (nameA === 'type') {
                    return -1;
                  } else if (nameB === 'type') {
                    return 1;
                  }

                  return optionalA === optionalB ? 0 : optionalA ? 1 : -1;
                },
              );

          if (
            !props[0] ||
            props[0].name !== 'type' ||
            props[0].value.value !== getShortName(name)
          ) {
            throw new Error(
              `generate-actions: Invalid type definition for '${name}' with props '${JSON.stringify(
                props,
                null,
                2,
              )}'.`,
            );
          }

          types.push({
            id: getStableTypeID(type, name),
            name,
            props,
            type,
          });
        }
      },
    });
  });
  return types;
};

const encodePropType = (
  actionName: string,
  actionType: ActionType,
  props: ReadonlyArray<Prop>,
): ReadonlyArray<string> =>
  props.reduce<Array<string>>((list, { name, optional, value: valueType }) => {
    const { type, value } = valueType;
    const suffix = optional ? ' | null' : '';
    if (name === 'type' && type === 'literal') {
      return [
        ...list,
        `${name}: ${getStableTypeID(actionType, actionName) + suffix}`,
      ];
    }

    if (type === 'boolean') {
      return [...list, `${name}: 0 | 1 ${suffix}`];
    }

    if (type === 'entities') {
      return [...list, `${name}: PlainEntitiesList<Plain${value + suffix}>`];
    }

    if (type === 'array') {
      return [
        ...list,
        `${name}: ${valueType.readonly ? 'Readonly' : ''}Array<${
          value === 'Vector' ? 'number' : value
        }>${suffix}`,
      ];
    }
    if (type === 'object' && typeof value !== 'string') {
      return [...list, ...encodePropType(actionName, actionType, value)];
    }

    if (type === 'reference' && value === 'Vector') {
      return [
        ...list,
        `${name}X: number ${suffix}`,
        `${name}Y: number ${suffix}`,
      ];
    }

    if (type === 'reference') {
      return [...list, `${name}: Plain${value}${suffix}`];
    }

    return [...list, `${name}: ${value}${suffix}`];
  }, []);

const encodeProps = (
  props: ReadonlyArray<Prop>,
  actionType: ActionType,
  prefix?: string,
): ReadonlyArray<string> =>
  props.reduce<Array<string>>(
    (list, { name, optional, value: { type, value } }) => {
      const identifier = `${prefix ? prefix + '.' : `${actionType}.`}${name}`;
      if (name === 'type' && type === 'literal' && typeof value === 'string') {
        return [...list, String(getStableTypeID(actionType, value))];
      }

      if (type === 'boolean') {
        return [...list, `${identifier} ? 1 : ${optional ? `null` : `0`}`];
      }

      if (type === 'entities') {
        return [...list, `encodeEntities(${identifier})`];
      }

      if (type === 'array') {
        if (value === 'Vector') {
          return [
            ...list,
            `${
              optional ? `${identifier}?.length ? ` : ''
            }${identifier}.flatMap(vector => [vector.x, vector.y])${
              optional ? ` : null` : ''
            }`,
          ];
        }
        return [...list, identifier];
      }

      if (type === 'object' && typeof value !== 'string') {
        return [...list, ...encodeProps(value, actionType, identifier)];
      }

      if (type === 'reference' && value === 'Vector') {
        if (optional) {
          return [
            ...list,
            `${identifier} != null ? ${identifier}.x : null`,
            `${identifier} != null ? ${identifier}.y : null`,
          ];
        }

        return [...list, `${identifier}.x`, `${identifier}.y`];
      }

      if (type === 'reference' && typeof value === 'string') {
        const encodeCall = scalarReferences.has(value)
          ? identifier
          : customEncoderReferences.has(value)
            ? `encode${value}(${identifier})`
            : `${identifier}.toJSON()`;
        if (optional) {
          return [...list, `${identifier} != null ? ${encodeCall} : null`];
        }
        return [...list, encodeCall];
      }

      return [
        ...list,
        optional ? `${identifier} != null ? ${identifier} : null` : identifier,
      ];
    },
    [],
  );

const decodeProps = (
  actionName: string,
  actionType: ActionType,
  props: ReadonlyArray<Prop>,
  counter = 0,
): ReadonlyArray<string> =>
  props
    .reduce<{ counter: number; list: Array<string> }>(
      ({ counter, list }, { name, optional, value: { type, value } }) => {
        if (name === 'type' && type === 'literal') {
          return {
            counter: counter + 1,
            list: [...list, `${name}: "${getShortName(actionName)}"`],
          };
        }

        if (type === 'boolean') {
          return {
            counter: counter + 1,
            list: [...list, `${name}: !!${actionType}[${counter}]`],
          };
        }

        if (type === 'entities' && typeof value === 'string') {
          return {
            counter: counter + 1,
            list: [
              ...list,
              `${name}: decodeEntities(action[${counter}], ${
                value.slice(0, 1).toUpperCase() + value.slice(1)
              }.fromJSON)`,
            ],
          };
        }

        if (type === 'array' && value === 'Vector') {
          return {
            counter: counter + 1,
            list: [
              ...list,
              `${name}: ${
                optional ? `action[${counter}] ? ` : ''
              }decodeVectorArray(action[${counter}])${
                optional ? ` : undefined` : ''
              }`,
            ],
          };
        }

        if (type === 'object' && typeof value !== 'string') {
          return {
            counter: counter + value.length,
            list: [
              ...list,
              `${name}: {${decodeProps(
                actionName,
                actionType,
                value,
                counter,
              ).join(',')}}`,
            ],
          };
        }

        if (type === 'reference' && value === 'Vector') {
          return {
            counter: counter + 2,
            list: [
              ...list,
              optional
                ? `${name}: ${actionType}[${counter}] && ${actionType}[${
                    counter + 1
                  }] ? vec(${actionType}[${counter}], ${actionType}[${
                    counter + 1
                  }]) : undefined`
                : `${name}: vec(${actionType}[${counter}], ${actionType}[${
                    counter + 1
                  }])`,
            ],
          };
        }

        if (type === 'reference' && typeof value === 'string') {
          const decodeCall = scalarReferences.has(value)
            ? `to${value}(${actionType}[${counter}])`
            : customEncoderReferences.has(value)
              ? `decode${value}(${actionType}[${counter}])`
              : `${value}.fromJSON(${actionType}[${counter}])`;
          return {
            counter: counter + 1,
            list: [
              ...list,
              optional
                ? `${name}: ${actionType}[${counter}] != null ? ${decodeCall} : undefined`
                : `${name}: ${decodeCall}`,
            ],
          };
        }

        return {
          counter: counter + 1,
          list: [
            ...list,
            `${name}: ${actionType}[${counter}]${
              optional ? ` ?? undefined` : ``
            }`,
          ],
        };
      },
      { counter, list: [] },
    )
    .list.sort((a, b) => a.localeCompare(b));

const directionMapper = new Map([
  ['direction', "direction: '${c.green(action.direction.direction)}'"],
]);

const fieldMappers = new Map([
  [
    'CreateBuilding',
    new Map([['id', "name: '${c.green(getBuildingInfo(action.id)?.name)}'"]]),
  ],
  [
    'CreateUnit',
    new Map([['id', "name: '${c.green(getUnitInfo(action.id)?.name)}'"]]),
  ],
  ['HiddenSourceAttackBuilding', directionMapper],
  ['HiddenSourceAttackUnit', directionMapper],
  ['HiddenTargetAttackBuilding', directionMapper],
  ['HiddenTargetAttackUnit', directionMapper],
]);

const formatCall = (value: string, name: string) =>
  scalarReferences.has(value)
    ? `util.inspect(${name}, formatOptions)`
    : customEncoderReferences.has(value)
      ? `util.inspect(format${value}(${name}), formatOptions)`
      : `${name}.info.name + ' ' + util.inspect(${name}.format ? ${name}.format() : ${name}.toJSON(), formatOptions)`;

const formatValue = (
  name: string,
  optional: boolean,
  { type, value }: ValueType,
  prefix?: string,
): string => {
  prefix = prefix ? prefix + '.' : '';
  if (type === 'entities' && typeof value === 'string') {
    return `${
      optional ? `\${action.${prefix}${name} ? \`` : ''
    }[\${action.${prefix}${name}.map((unit, vector) => c.red(vector.x) + ',' + c.red(vector.y) + ' → ' + ${formatCall(
      value,
      `unit`,
    )}).join(', ')}]${optional ? `\` : c.dim('null')}` : ''}`;
  }

  if (type === 'array' && value === 'Vector') {
    return `${
      optional ? `\${action.${prefix}${name} ? \`` : ''
    }[\${action.${prefix}${name}.map(vector => c.red(vector.x) + ',' + c.red(vector.y)).join(' → ')}]${
      optional ? `\` : c.dim('null')}` : ''
    }`;
  }

  if (type === 'object' && typeof value !== 'string') {
    return `{ ${value
      .map((prop) => formatProp(name, prop, prefix + name))
      .join(', ')} }`;
  }

  if (type === 'reference' && value === 'Vector') {
    return `\${c.red(action.${prefix}${name}.x) + ',' + c.red(action.${prefix}${name}.y)}`;
  }

  if (type === 'reference' && typeof value === 'string') {
    return `\${${optional ? `action.${prefix}${name} ? ` : ''}${formatCall(
      value,
      `action.${prefix}${name}`,
    )}${optional ? ` : c.dim('null')` : ''}}`;
  }

  let formattedValue = `action.${prefix}${name}`;
  if (value === 'number') {
    formattedValue = `c.red(action.${prefix}${name})`;
  } else if (value === 'boolean') {
    formattedValue = `c.blue(!!action.${prefix}${name})`;
  } else if (value === 'string') {
    formattedValue = `c.green("'" + action.${prefix}${name} + "'")`;
  }

  return optional
    ? `\${action.${prefix}${name} != null ? ${formattedValue} : c.dim('null')}`
    : `\${${formattedValue}}`;
};

const formatProp = (
  shortActionName: string,
  { name, optional, value }: Prop,
  prefix?: string,
): string => {
  return fieldMappers.has(shortActionName) &&
    fieldMappers.get(shortActionName)!.has(name)
    ? fieldMappers.get(shortActionName)!.get(name)!
    : `${name}: ${formatValue(name, optional, value, prefix)}`;
};

const formatAction = ({
  name: actionName,
  props,
  type,
}: ExtractedType): string => {
  const shortName = getShortName(actionName);
  const from = props.find(({ name }) => name === 'from');
  const to = props.find(({ name }) => name === 'to');
  props = props.filter(
    ({ name }) => name !== 'type' && name !== 'from' && name !== 'to',
  );
  const content = ` \${c.dim('{')} ${props
    .map((prop) => formatProp(shortName, prop))
    .join(', ')} \${c.dim('}')}`;
  const allAreOptional = props.every(({ optional }) => optional);
  return `
  case '${shortName}':
    return \`\${c.bold('${shortName}')}${
      from || to
        ? ` (${
            from
              ? from.optional
                ? '${action.from ? `${c.red(action.from.x)},${c.red(action.from.y)}` : ""}'
                : '${c.red(action.from.x)},${c.red(action.from.y)}'
              : ''
          }${
            from && to
              ? to.optional || from.optional
                ? '${action.from && action.to ? " " : ""}'
                : ' '
              : ''
          }${
            to
              ? to.optional
                ? '${action.to ? `→ ${c.red(action.to.x)},${c.red(action.to.y)}` : ""}'
                : '→ ${c.red(action.to.x)},${c.red(action.to.y)}'
              : ''
          })`
        : ''
    }${
      props.length
        ? allAreOptional
          ? `\${${props
              .map(({ name }) => `action.${name}`)
              .join(' || ')} ? \`${content}\` : ''}`
          : content
        : ''
    }\`;`;
};

const write = async (extractedTypes: ReadonlyArray<ExtractedType>) => {
  const group = groupBy(extractedTypes, ({ name }) =>
    name.endsWith('Action')
      ? 'action'
      : name.endsWith('ActionResponse')
        ? 'action-response'
        : 'condition',
  );

  const actions = group.get('action');
  const conditions = group.get('condition');
  const actionResponses = group.get('action-response');

  if (!actions || !conditions || !actionResponses) {
    throw new Error(`generate-actions: Some action types are missing.`);
  }

  const code = [
    `
      import { Action, Actions } from './Action.tsx';
      import { ActionResponse, ActionResponses, ActionResponseType } from './ActionResponse.tsx';
      import {
        Condition,
        Conditions,
        PlainDynamicEffectObjectiveID,
        decodeDynamicEffectObjectiveID,
        encodeDynamicEffectObjectiveID,
      } from './Condition.tsx';
      import {
        AttackDirection,
        PlainAttackDirection,
      } from './attack-direction/getAttackDirection.tsx';
      import {
        PlainObjective,
        decodeObjective,
        encodeObjective,
      } from '@deities/athena/Objectives.tsx';
      import { Skill as PlainSkill } from '@deities/athena/info/Skill.tsx';
      import Building, { PlainBuilding } from '@deities/athena/map/Building.tsx';
      import { PlainEntitiesList } from '@deities/athena/map/PlainMap.tsx';
      import {
        decodeDynamicPlayerID,
        encodeDynamicPlayerID,
        PlainDynamicPlayerID,
        PlainPlayerID,
        toPlayerID
      } from '@deities/athena/map/Player.tsx';
      import {
        decodeReward,
        encodeReward,
        PlainReward,
      } from '@deities/athena/map/Reward.tsx';
      import {
        decodeEntities,
        decodeTeams,
        encodeEntities,
        encodeTeams,
      } from '@deities/athena/map/Serialization.tsx';
      import { PlainTeams } from '@deities/athena/map/Team.tsx';
      import Unit, {
        DryUnit,
        PlainDryUnit,
        PlainUnit,
      } from '@deities/athena/map/Unit.tsx';
      import { decodeVectorArray } from '@deities/athena/map/Vector.tsx';
      import vec from '@deities/athena/map/vec.tsx';
    `,
    ...extractedTypes.map(({ name, props, type }) => {
      return `
    type Encoded${name} = [ 
      ${encodePropType(name, type, props).join(',')}
    ]`;
    }),
    `
    export type EncodedAction = ${actions
      .map(({ name }) => `Encoded${name}`)
      .join(' | ')}`,
    `export type EncodedCondition = ${conditions
      .map(({ name }) => `Encoded${name}`)
      .join(' | ')}`,
    `export type EncodedActionResponse = ${actionResponses
      .map(({ name }) => `Encoded${name}`)
      .join(' | ')}`,
    `
    export type EncodedActions = ReadonlyArray<EncodedAction>;
    export type EncodedConditions = ReadonlyArray<EncodedCondition>;
    export type EncodedActionResponses = ReadonlyArray<EncodedActionResponse>;
    export type EncodedActionResponseType = EncodedActionResponse[0];

    const toSkill = (skill: PlainSkill) => skill;

    const removeNull = <T extends EncodedAction | EncodedActionResponse>(array: T): T => {
      let index = array.length - 1;
      while (array[index as number] == null) {
        index--;
      }
      array.length = (index + 1) as typeof array.length;
      return array;
    };

    export function encodeAction(action: Action): EncodedAction {
      switch (action.type) {
    `,
    ...actions.map(({ name, props, type }) => {
      const hasOptional = props.at(-1)?.optional;
      const value = `[${encodeProps(props, type).join(',')}]`;
      return `
        case '${getShortName(name)}':
          return ${hasOptional ? `removeNull(${value})` : value};`;
    }),
    `
    }}

    export function encodeActions(actions: Actions): EncodedActions {
      return actions.map(encodeAction);
    }

    export function encodeCondition(condition: Condition): EncodedCondition {
      switch (condition.type) {
    `,
    ...conditions.map(({ name, props, type }) => {
      const hasOptional = props.at(-1)?.optional;
      const value = `[${encodeProps(props, type).join(',')}]`;
      return `
        case '${getShortName(name)}':
          return ${hasOptional ? `removeNull(${value})` : value};`;
    }),
    `
    }}
    export function encodeConditions(conditions: Conditions): EncodedConditions {
      return conditions.map(encodeCondition);
    }

    export function encodeActionResponse(action: ActionResponse): EncodedActionResponse {
      switch (action.type) {
    `,
    ...actionResponses.map(({ name, props, type }) => {
      const hasOptional = props.at(-1)?.optional;
      const value = `[${encodeProps(props, type).join(',')}]`;
      return `
        case '${getShortName(name)}':
          return ${hasOptional ? `removeNull(${value})` : value};`;
    }),
    `
    }}
    export function encodeActionResponses(actions: ActionResponses): EncodedActionResponses {
      return actions.map(encodeActionResponse);
    }

    export function encodeActionID(action: ActionResponseType): EncodedActionResponseType {
      switch (action) {
    `,
    ...actionResponses.map(
      ({ name, type }) =>
        `case '${getShortName(name)}':
          return ${getStableTypeID(type, name)};`,
    ),
    `default: {
        throw new Error('encodeActionID: Invalid Action ID.');
      }
    }}
    export function decodeAction(action: EncodedAction): Action {
      switch (action[0]) {
    `,
    ...actions.map(
      ({ name, props, type }) => `
        case ${getStableTypeID(type, name)}:
          return {${decodeProps(name, type, props).join(',')}};`,
    ),
    `}}
    export function decodeActions(actions: EncodedActions): Actions {
      return actions.map(decodeAction);
    }

    export function decodeCondition(condition: EncodedCondition): Condition {
      switch (condition[0]) {
    `,
    ...conditions.map(
      ({ name, props, type }) => `
        case ${getStableTypeID(type, name)}:
          return {${decodeProps(name, type, props).join(',')}};`,
    ),
    `
    }}
    export function decodeConditions(conditions: EncodedConditions): Conditions {
      return conditions.map(decodeCondition);
    }

    export function decodeActionResponse(action: EncodedActionResponse): ActionResponse {
      switch (action[0]) {
    `,
    ...actionResponses.map(
      ({ name, props, type }) =>
        `case ${getStableTypeID(type, name)}:
          return {${decodeProps(name, type, props).join(',')}};`,
    ),
    `
    }}
    export function decodeActionResponses(action: EncodedActionResponses): ActionResponses {
      return action.map(decodeActionResponse);
    }

    export function decodeActionID(encodedAction: EncodedActionResponseType): ActionResponseType {
      switch (encodedAction) {
    `,
    ...actionResponses.map(
      ({ name, type }) =>
        `case ${getStableTypeID(type, name)}:
          return '${getShortName(name)}';`,
    ),
    `default: {
        throw new Error('decodeActionID: Invalid Action ID.');
      }
    }}`,
  ];

  const formatCode = [
    `
      import { Action } from './Action.tsx';
      import { ActionResponse, ActionResponses } from './ActionResponse.tsx';
      import { formatObjective } from '@deities/athena/Objectives.tsx';
      import { getBuildingInfo } from '@deities/athena/info/Building.tsx';
      import { getUnitInfo } from '@deities/athena/info/Unit.tsx';
      import { formatReward } from '@deities/athena/map/Reward.tsx';
      import { formatTeams } from '@deities/athena/map/Serialization.tsx';
      import chalk, { Chalk } from 'chalk';
      import util from 'node:util';
      
      const formatDynamicPlayerID = String;

      const fakeChalk = new Chalk({ level: 0 });
      util.inspect.styles.number = 'red';
      util.inspect.styles.boolean = 'blue';

      export function formatAction(
        action: Action,
        { colors }: { colors: boolean } = { colors: true },
      ): string {
        const c = colors ? chalk : fakeChalk;
        const formatOptions = {breakLength: Number.POSITIVE_INFINITY, colors, compact: true, depth: Number.POSITIVE_INFINITY};
        switch (action.type) {
    `,
    ...actions.map(formatAction),
    `
    }}
    export function formatActions(actions: ReadonlyArray<Action>, {colors}: {colors: boolean} = {colors: true}): ReadonlyArray<string> {
      return actions.map(action => formatAction(action, {colors}));
    }`,
    `
    export function formatActionResponse(action: ActionResponse, {colors}: {colors: boolean} = {colors: true}): string {
      const c = colors ? chalk : fakeChalk;
      const formatOptions = {breakLength: Number.POSITIVE_INFINITY, colors, compact: true, depth: Number.POSITIVE_INFINITY};
      switch (action.type) {
      `,
    ...actionResponses.map(formatAction),
    `
    }}
    export function formatActionResponses(actions: ActionResponses, {colors}: {colors: boolean} = {colors: true}): ReadonlyArray<string> {
      return actions.map(action => formatActionResponse(action, {colors}));
    }`,
  ];

  const getPropNames = (props: ReadonlyArray<Prop>): ReadonlyArray<string> =>
    props.flatMap(({ name, value }) => [
      name,
      ...(value.type === 'object' ? getPropNames(value.value) : []),
    ]);

  const getOptionalProps = (
    props: ReadonlyArray<Prop>,
  ): ReadonlyArray<string> =>
    props.flatMap(({ name, optional, value }) =>
      // Do not reorder to/from Vectors since it changes existing encoded actions.
      optional && name !== 'to' && name !== 'from'
        ? [name, ...(value.type === 'object' ? getPropNames(value.value) : [])]
        : [],
    );

  const newActionMap = new Map<string, [number, ReadonlySet<string>]>();
  for (const action of actions) {
    newActionMap.set(getShortName(action.name), [
      action.id,
      new Set(getPropNames(action.props)),
    ]);
  }

  for (const action of actionResponses) {
    const name = getShortName(action.name);
    const optionalProps = new Set(getOptionalProps(action.props));
    newActionMap.set(name, [
      action.id,
      new Set([
        ...Array.from(newActionMap.get(name)?.[1] || []).filter(
          (propName) => !optionalProps.has(propName),
        ),
        ...getPropNames(action.props),
      ]),
    ]);
  }
  const actionMapOutput = await format(
    JSON.stringify(
      sortBy(
        Array.from(newActionMap).map(
          ([name, [id, props]]) => [name, [id, Array.from(props)]] as const,
        ),
        ([, [id]]) => id,
      ),
    ),
    {
      filepath: stableActionMapFileName,
      parser: 'json',
    },
  );

  const newConditionMap = new Map<string, [number, ReadonlySet<string>]>();
  for (const condition of conditions) {
    newConditionMap.set(getShortName(condition.name), [
      condition.id,
      new Set(getPropNames(condition.props)),
    ]);
  }

  const conditionMapOutput = await format(
    JSON.stringify(
      sortBy(
        Array.from(newConditionMap).map(
          ([name, [id, props]]) => [name, [id, Array.from(props)]] as const,
        ),
        ([, [id]]) => id,
      ),
    ),
    {
      filepath: stableConditionMapFileName,
      parser: 'json',
    },
  );
  const encodedActionsOutput = sign(
    await format(code.join('\n'), {
      filepath: encodedActionsFileName,
      singleQuote: true,
    }),
  );
  const formatActionsOutput = sign(
    await format(formatCode.join('\n'), {
      filepath: formatActionsFileName,
      singleQuote: true,
    }),
  );

  writeFileSync(stableActionMapFileName, actionMapOutput);
  writeFileSync(stableConditionMapFileName, conditionMapOutput);
  writeFileSync(encodedActionsFileName, encodedActionsOutput);
  writeFileSync(formatActionsFileName, formatActionsOutput);
};

await write(extract(files));

console.log(chalk.bold.green('✓ Done generating actions.'));
