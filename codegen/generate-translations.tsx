#!/usr/bin/env node --no-warnings --experimental-specifier-resolution=node --loader ts-node/esm
import { writeFileSync } from 'node:fs';
import { basename, extname, join, posix, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  GameEndCondition,
  OptionalObjectiveCondition,
} from '@deities/apollo/Condition.tsx';
import getMessageKey from '@deities/apollo/lib/getMessageKey.tsx';
import { mapBuildings } from '@deities/athena/info/Building.tsx';
import { mapDecorators } from '@deities/athena/info/Decorator.tsx';
import { mapTiles } from '@deities/athena/info/Tile.tsx';
import {
  getUnitInfo,
  getUnitInfoOrThrow,
  mapMovementTypes,
  mapUnits,
  mapWeapons,
} from '@deities/athena/info/Unit.tsx';
import {
  isEntityMessageTag,
  MessageConjunctions,
  MessageTemplate,
  MessageVocabulary,
} from '@deities/athena/message/Message.tsx';
import ActivatePowerMessages from '@deities/hermes/messages/ActivatePowerMessages.tsx';
import { CampaignModule, MapModule } from '@deities/hermes/Types.tsx';
import unrollCampaign from '@deities/hermes/unrollCampaign.tsx';
import isPresent from '@nkzw/core/isPresent.js';
import parseInteger from '@nkzw/core/parseInteger.js';
import sortBy from '@nkzw/core/sortBy.js';
import chalk from 'chalk';
import { globSync } from 'glob';
import { format } from 'prettier';
import isOpenSource from '../infra/isOpenSource.tsx';
import sign from './lib/sign.tsx';

type EntityDescription = Readonly<{
  description: string;
  detail?: string;
  hasNameSubstitution?: boolean;
  id: number;
}>;

const root = process.cwd();
const isOpenSourceRepository = isOpenSource();

const publishedCampaigns = new Map([
  ['proto-campaign', Number.POSITIVE_INFINITY],
  ['the-athena-crisis', Number.POSITIVE_INFINITY],
  ['tutorial', Number.POSITIVE_INFINITY],
]);

const COMMON_OUTPUT_FILE = join(root, 'i18n/Entities.ts');
const ENTITY_MAP_OUTPUT_FILE = join(root, 'hera/i18n/EntityMap.tsx');
const CAMPAIGN_MAP_OUTPUT_FILE = join(root, 'hera/i18n/CampaignMap.tsx');
const MESSAGE_MAP_OUTPUT_FILE = join(root, 'hera/i18n/MessageMap.tsx');

console.log(chalk.bold('› Generating translations...'));

const globs: ReadonlyArray<string> = [
  './hermes/map-fixtures/*.tsx',
  './fixtures/map/*.tsx',
];
const maps = await Promise.all(
  globs.flatMap((path) =>
    globSync(join(root, path).split(sep).join(posix.sep))
      .sort()
      .map((filename) =>
        (import(pathToFileURL(filename).toString()) as Promise<MapModule>).then(
          (module) => ({
            id: basename(filename, extname(filename)),
            module,
          }),
        ),
      ),
  ),
);

const mapsById = new Map(maps.map(({ id, module }) => [id, module]));

const campaigns = await Promise.all(
  globSync(join(root, './fixtures/campaign/*.tsx').split(sep).join(posix.sep))
    .sort()
    .map((filename) =>
      (
        import(pathToFileURL(filename).toString()) as Promise<CampaignModule>
      ).then((module) => ({
        id: basename(filename, extname(filename)),
        module,
      })),
    ),
);

const campaignMetadata: Array<string> = [];
if (isOpenSourceRepository) {
  campaignMetadata.push(
    `'placeholder-campaign': () => String(fbt(\`placeholder-campaign\`, ${JSON.stringify(`Translation for campaign name 'placeholder-campaign'.`)})),`,
  );
}

const campaignMaps = isOpenSourceRepository
  ? maps.map((map) => ({
      campaignName: 'placeholder-campaign',
      map: map.module,
    }))
  : campaigns
      .filter(({ id }) => publishedCampaigns.has(id))
      .flatMap(({ id, module }) => {
        const { description, name } = module.default;
        campaignMetadata.push(
          `${JSON.stringify(name)}: () => String(fbt(\`${name}\`, ${JSON.stringify(`Translation for campaign name '${name}'.`)})),`,
        );
        if (description) {
          campaignMetadata.push(
            `${JSON.stringify(description)}: () => String(fbt(\`${description}\`, ${JSON.stringify(`Description for campaign '${name}'.`)})),`,
          );
        }

        const publishedLevels = publishedCampaigns.get(id)!;
        const maps = [];
        for (const [level] of unrollCampaign(module.default)) {
          const map = mapsById.get(level);
          if (!map) {
            throw new Error(
              `Could not find map ${level} for campaign ${module.default.name}.`,
            );
          }
          const maybeMapNumber = map.metadata.tags?.find((tag) =>
            parseInteger(tag),
          );
          const mapNumber = maybeMapNumber
            ? parseInteger(maybeMapNumber)
            : null;

          if (
            publishedLevels === Number.POSITIVE_INFINITY ||
            (mapNumber && mapNumber > 0 && mapNumber <= publishedLevels)
          ) {
            maps.push({
              campaignName:
                name === 'Prequel Campaign' ? 'Proto Campaign' : name,
              map,
            });
          }
        }
        return maps;
      });

const characterMessages = campaignMaps.flatMap(
  ({
    campaignName,
    map: {
      metadata: { effects, name, tags },
    },
  }) => {
    if (!effects?.size) {
      return [];
    }

    const mapNumber = tags?.find((tag) => parseInteger(tag)) || '';
    const actions: Array<{
      description: string;
      key: string;
      message: string;
      unitId: number;
    }> = [];
    for (const [trigger, effectList] of effects) {
      for (const effect of effectList) {
        const condition = effect.conditions?.find(
          (
            condition,
          ): condition is GameEndCondition | OptionalObjectiveCondition =>
            condition.type === 'GameEnd' ||
            condition.type === 'OptionalObjective',
        );
        const objective = condition?.value ?? null;
        let count = 1;
        for (const action of effect.actions) {
          if (action.type === 'CharacterMessageEffect') {
            actions.push({
              description: `Campaign ${campaignName}, Map${
                mapNumber ? ` ${mapNumber}` : ''
              } "${name}", ${trigger}${
                objective ? ` ${objective}` : ''
              }, #${count++}: Player ${action.player}, Character ${
                getUnitInfoOrThrow(action.unitId).characterName
              }`,
              key: getMessageKey(action),
              message: action.message,
              unitId: action.unitId,
            });
          }
        }
      }
    }

    return actions;
  },
);

for (const [skill, messages] of ActivatePowerMessages) {
  for (const [message] of messages) {
    characterMessages.push({
      description: `Activate Power Message for skill ${skill}`,
      key: getMessageKey(message),
      message: message.message,
      unitId: message.unitId,
    });
  }
}

const extractName = ({ name }: { name: string }) => name;
const sort = (a: string, b: string) => a.localeCompare(b);

const entityMap = new Map([
  ['Building', mapBuildings(extractName).sort(sort)],
  ['Character', mapUnits(({ characterName }) => characterName).sort(sort)],
  ['Decorator', mapDecorators(extractName).sort(sort)],
  ['MovementType', mapMovementTypes(extractName).sort(sort)],
  ['Tile', mapTiles(extractName).sort(sort)],
  ['Unit', mapUnits(extractName).sort(sort)],
  ['Weapon', mapWeapons(extractName).sort(sort)],
  [
    'Map',
    maps.map(({ module: { metadata } }) => metadata.name || '').sort(sort),
  ],
]);

const descriptionMap = new Map<string, ReadonlyArray<EntityDescription>>([
  [
    'BuildingDescription',
    sortBy(
      mapBuildings(({ description, id, name }) => ({
        description,
        detail: `name: ${name}`,
        id,
      })),
      ({ id }) => id,
    ),
  ],
  [
    'TileDescription',
    sortBy(
      mapTiles(({ description, id, name }) => ({
        description,
        detail: `name: ${name}`,
        id,
      })),
      ({ id }) => id,
    ),
  ],
  [
    'UnitCharacterDescription',
    sortBy(
      mapUnits((unit) => ({
        description: unit.getOriginalCharacterDescription(),
        detail: `name: ${unit.characterName}, gender: ${unit.gender}`,
        hasNameSubstitution: true,
        id: unit.id,
      })),
      ({ id }) => id,
    ),
  ],
  [
    'UnitDescription',
    sortBy(
      mapUnits(({ description, id, name }) => ({
        description,
        detail: `name: ${name}`,
        id,
      })),
      ({ id }) => id,
    ),
  ],
]);

const replaceSubstitutions = (text: string, currentId: number) => {
  const existingSubstitutions = new Set();
  return text.replaceAll(/{(?:(\d+)\.)?name}/g, (_, maybeId) => {
    const maybeUnitID = maybeId?.length && parseInteger(maybeId);
    const unit =
      (maybeUnitID && getUnitInfo(maybeUnitID)) || getUnitInfo(currentId);
    if (!unit) {
      throw new Error(
        `generate-entity-translations: Could not find unit for name substitution for unit with id '${currentId}'.`,
      );
    }
    if (existingSubstitutions.has(unit.id)) {
      return `\${fbt.sameParam('${unit.id}.name')}`;
    }

    existingSubstitutions.add(unit.id);
    return `\${fbt.param('${unit.id}.name', getUnitInfoOrThrow(${unit.id}).characterName)}`;
  });
};

const commonNames = new Set();
const toCommon = (typeName: string, list: ReadonlyArray<string>) =>
  list
    .map((name) => {
      if (commonNames.has(name)) {
        return null;
      }

      commonNames.add(name);
      return `${JSON.stringify(name)}: ${JSON.stringify(
        `${typeName} name${
          typeName === 'Map'
            ? ` (Only translate map names if it helps with understanding)`
            : ''
        }`,
      )}`;
    })
    .filter(isPresent);

const nameMapToCode = (list: ReadonlyArray<string>) =>
  Array.from(new Set(list))
    .map(
      (field) =>
        `${JSON.stringify(field)}: () => String(fbt.c(${JSON.stringify(
          field,
        )}))`,
    )
    .join(',\n');

const descriptionMapToCode = (
  typeName: string,
  list: ReadonlyArray<EntityDescription>,
) =>
  Array.from(new Set(list))
    .map(
      ({ description, detail, hasNameSubstitution, id }) =>
        `${JSON.stringify(String(id))}: () => String(fbt(\`${
          hasNameSubstitution
            ? replaceSubstitutions(description, id)
            : description
        }\`, ${JSON.stringify(detail ? `${typeName} - ${detail}` : typeName)}))`,
    )
    .join(',\n');

const common = [];
const entities = [];

for (const [typeName, names] of entityMap) {
  common.push(...toCommon(typeName, names));
  entities.push(
    `export const ${typeName}Map = {${nameMapToCode(names)}} as const;`,
  );
}

for (const [typeName, descriptions] of descriptionMap) {
  entities.push(
    `export const ${typeName}Map = {${descriptionMapToCode(
      typeName,
      descriptions,
    )}} as const;`,
  );
}

const campaign = [];
const seenMessages = new Set();
for (const { description, key, message, unitId } of characterMessages) {
  if (seenMessages.has(key)) {
    continue;
  }
  seenMessages.add(key);
  campaign.push(
    `"${key}": () => String(fbt(\`${replaceSubstitutions(
      message,
      unitId,
    )}\`, ${JSON.stringify(description)})),`,
  );
}

const entityTags = [];
for (const [tag, vocabulary] of MessageVocabulary) {
  if (!isEntityMessageTag(tag)) {
    entityTags.push(
      `[${tag}, new Map([
        ${[...vocabulary].map(([id, name]) => `[${id}, () => String(fbt(\`${name}\`, \`Message system vocabulary.\`))]`)}
      ])],`,
    );
  }
}

const conjunctions = [];
for (const [id, conjunction] of MessageConjunctions) {
  conjunctions.push(
    `[${id}, () => String(fbt(\`${conjunction}\`, \`Message system conjunction.\`))]`,
  );
}

const templates = [];
const punctuations = [];
for (const [id, [message, , punctuation]] of MessageTemplate) {
  templates.push(
    `[${id}, () => String(fbt(\`${message}\`, \`Message system template.\`))]`,
  );
  punctuations.push(
    `[${id}, () => String(fbt(\`${punctuation}\`, ${JSON.stringify(`Message system punctuation for '${message}'.`)}))]`,
  );
}

const plugins = ['@ianvs/prettier-plugin-sort-imports'];

writeFileSync(
  COMMON_OUTPUT_FILE,
  await format(sign(`export default {${common.join(',\n')}};`), {
    filepath: COMMON_OUTPUT_FILE,
    plugins,
    singleQuote: true,
  }),
);

writeFileSync(
  ENTITY_MAP_OUTPUT_FILE,
  await format(
    sign(
      [
        `import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';`,
        `import { fbt } from 'fbtee';`,
        ...entities,
      ].join('\n'),
    ),
    {
      filepath: ENTITY_MAP_OUTPUT_FILE,
      plugins,
      singleQuote: true,
    },
  ),
);

writeFileSync(
  CAMPAIGN_MAP_OUTPUT_FILE,
  await format(
    sign(
      [
        `import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';`,
        `import { fbt } from 'fbtee';`,
        `export const CampaignMetadata = {${campaignMetadata.join('\n')}};\n`,
        `export default {`,
        campaign.join('\n'),
        `}`,
      ].join('\n'),
    ),
    {
      filepath: CAMPAIGN_MAP_OUTPUT_FILE,
      plugins,
      singleQuote: true,
    },
  ),
);

writeFileSync(
  MESSAGE_MAP_OUTPUT_FILE,
  await format(
    sign(
      [
        `import { fbt } from 'fbtee';`,
        `export const TranslatedMessageVocabulary = new Map([`,
        entityTags.join('\n'),
        `]);`,
        `export const TranslatedMessageConjunctions = new Map([`,
        conjunctions.join(',\n'),
        `]);`,
        `export const TranslatedMessageTemplate = new Map([`,
        templates.join(',\n'),
        `]);`,
        `export const TranslatedMessagePunctuation = new Map([`,
        punctuations.join(',\n'),
        `]);`,
      ].join('\n'),
    ),
    {
      filepath: MESSAGE_MAP_OUTPUT_FILE,
      plugins,
      singleQuote: true,
    },
  ),
);

console.log(chalk.bold.green('✓ Done generating translations.'));
