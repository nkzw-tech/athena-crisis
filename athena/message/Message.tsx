import isPresent from '@nkzw/core/isPresent.js';
import sortBy from '@nkzw/core/sortBy.js';
import { mapBuildings } from '../info/Building.tsx';
import { Skills } from '../info/Skill.tsx';
import { mapTiles } from '../info/Tile.tsx';
import { mapUnits } from '../info/Unit.tsx';
import { PlayerID, PlayerIDs, toPlayerID } from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';

export type MapMessageValue = readonly [tag: number, value: number, player?: PlayerID];

export type PlainMapMessage = Readonly<{
  player: PlayerID;
  template: number;
  value: MapMessageValue;
}>;

type BasicMapMessage<T extends Vector | readonly [number, number]> = PlainMapMessage &
  Readonly<{
    position: T;
  }>;

type NestedMessage = Readonly<{
  conjunction?: number;
  next?: PlainMapMessage;
}>;

export type MapMessage<T extends Vector | readonly [number, number]> = BasicMapMessage<T> &
  NestedMessage;

export type EncodedMapMessage = MapMessage<readonly [number, number]>;

export type MessageTemplateEntry = readonly [
  message: string,
  tags: ReadonlyArray<MessageTag>,
  punctuation: string,
];

export enum MessageTag {
  Building = 1,
  Unit = 2,
  Tile = 3,
  Threat = 4,
  Strategy = 5,
  Social = 6,
  Resource = 7,
  Comment = 8,
  Teamplay = 9,
  Skill = 10,
  Faction = 11,
}

export type EntityMessageTag =
  | MessageTag.Building
  | MessageTag.Unit
  | MessageTag.Tile
  | MessageTag.Skill
  | MessageTag.Faction;

const entityMessageTags = new Set([
  MessageTag.Building,
  MessageTag.Faction,
  MessageTag.Skill,
  MessageTag.Tile,
  MessageTag.Unit,
]);

export function isValidMapMessageValue(value: Partial<MapMessageValue>): value is MapMessageValue {
  return value[0] != null && value[1] != null;
}

export function toPlainMapMessage(message: unknown): PlainMapMessage | null {
  const {
    player,
    template,
    value: [tag, value, playerID],
  } = message as EncodedMapMessage;
  const templateEntry = MessageTemplate.get(template);
  if (!templateEntry) {
    return null;
  }

  try {
    if (!templateEntry[1].includes(tag)) {
      return null;
    }

    const vocabulary = MessageVocabulary.get(tag)?.get(value);
    if (!vocabulary) {
      return null;
    }

    if (playerID !== undefined) {
      toPlayerID(playerID);
    }

    return {
      player: toPlayerID(player),
      template,
      value: [tag, value, playerID],
    };
  } catch {
    /* empty */
  }

  return null;
}

export function messageTagHasPlayerID(tag: MessageTag) {
  return tag === MessageTag.Building || tag === MessageTag.Unit;
}

export function isEntityMessageTag(tag: MessageTag): tag is EntityMessageTag {
  return entityMessageTags.has(tag);
}

export const MessageConjunctions = new Map([
  [1, 'and then'],
  [2, 'or'],
  [3, 'but'],
  [4, 'therefore'],
  [5, 'except'],
  [6, 'meanwhile'],
  [7, 'however'],
  [8, 'otherwise'],
]);

const tileNames = new Set<string>();
const tiles = new Map(
  sortBy(
    mapTiles((tile) => {
      const originalName = tile.getOriginalName();
      if (tileNames.has(originalName)) {
        return null;
      }

      tileNames.add(originalName);
      return [tile.id, tile.name] as const;
    }).filter(isPresent),
    ([id]) => id,
  ),
);

export const MessageVocabulary = new Map<MessageTag, ReadonlyMap<number, string>>([
  [MessageTag.Unit, new Map(mapUnits(({ id, name }) => [id, name]))],
  [MessageTag.Building, new Map(mapBuildings(({ id, name }) => [id, name]))],
  [MessageTag.Tile, tiles],
  [MessageTag.Faction, new Map(PlayerIDs.slice(1).map((id) => [id, String(id)]))],
  [MessageTag.Skill, new Map([...Skills].map((skill) => [skill, String(skill)]))],
  [
    MessageTag.Threat,
    new Map([
      [1, 'spawn'],
      [2, 'ambush'],
      [3, 'artillery'],
      [4, 'chokepoint'],
      [5, 'counterattack'],
      [6, 'fog'],
      [7, 'crisis'],
      [8, 'sabotage'],
      [9, 'sniper'],
      [10, 'trap'],
      [11, 'flank'],
      [12, 'airstrike'],
      [13, 'poison'],
    ]),
  ],
  [
    MessageTag.Strategy,
    new Map([
      [1, 'capture'],
      [2, 'heal'],
      [3, 'rescue'],
      [4, 'sabotage'],
      [5, 'poison'],
      [6, 'unfold'],
      [7, 'building'],
      [8, 'turtle'],
      [9, 'defending'],
      [10, 'scout'],
      [11, 'push'],
      [12, 'sneak'],
      [13, 'hold'],
      [14, 'bait'],
      [15, 'transport'],
      [16, 'retreat'],
      [17, 'rush'],
      [18, 'escort'],
      [19, 'fortify'],
      [20, 'lightning'],
    ]),
  ],
  [
    MessageTag.Social,
    new Map([
      [1, 'chaos'],
      [2, 'confusion'],
      [3, 'skill'],
      [4, 'luck'],
      [5, 'failure'],
      [6, 'timing'],
      [7, 'surprise'],
      [8, 'style'],
      [9, 'drama'],
      [10, 'victory'],
      [11, 'regret'],
      [12, 'gg'],
      [13, 'boom'],
      [14, 'secret'],
    ]),
  ],
  [
    MessageTag.Resource,
    new Map([
      [1, 'funds'],
      [2, 'ammo'],
      [3, 'charge'],
      [4, 'power'],
      [5, 'supplies'],
      [6, 'leader'],
      [7, 'reinforcements'],
      [8, 'air support'],
      [9, 'nukes'],
    ]),
  ],
  [
    MessageTag.Comment,
    new Map([
      [1, 'blunder'],
      [2, 'comeback'],
      [3, 'disaster'],
      [4, 'genius'],
      [5, 'masterpiece'],
      [6, 'miracle'],
      [7, 'overkill'],
      [8, 'panic'],
      [9, 'revenge'],
      [10, 'shame'],
    ]),
  ],
  [
    MessageTag.Teamplay,
    new Map([
      [1, 'support'],
      [2, 'save'],
      [3, 'backup'],
      [4, 'betrayal'],
      [5, 'cover'],
      [6, 'distraction'],
      [7, 'miscommunication'],
      [8, 'rally'],
      [9, 'revenge'],
    ]),
  ],
]);

export const MessageTemplate = new Map<number, MessageTemplateEntry>([
  [1, ['Attack {tag}', [MessageTag.Unit, MessageTag.Building, MessageTag.Faction], '!']],
  [2, ['Defend {tag}', [MessageTag.Unit, MessageTag.Building, MessageTag.Faction], '!']],
  [3, ['Capture {tag}', [MessageTag.Building], '!']],

  [
    4,
    [
      'Watch out for {tag}',
      [MessageTag.Unit, MessageTag.Tile, MessageTag.Threat, MessageTag.Faction],
      '.',
    ],
  ],
  [
    5,
    [
      'Possible {tag} ahead',
      [
        MessageTag.Unit,
        MessageTag.Faction,
        MessageTag.Skill,
        MessageTag.Threat,
        MessageTag.Comment,
        MessageTag.Social,
      ],
      '.',
    ],
  ],
  [
    6,
    [
      'Need {tag}',
      [
        MessageTag.Unit,
        MessageTag.Building,
        MessageTag.Skill,
        MessageTag.Tile,
        MessageTag.Resource,
      ],
      '!',
    ],
  ],
  [
    7,
    [
      'Try {tag}',
      [
        MessageTag.Unit,
        MessageTag.Tile,
        MessageTag.Skill,
        MessageTag.Strategy,
        MessageTag.Teamplay,
      ],
      '.',
    ],
  ],
  [
    8,
    [
      'Could this be {tag}',
      [
        MessageTag.Unit,
        MessageTag.Threat,
        MessageTag.Resource,
        MessageTag.Social,
        MessageTag.Comment,
      ],
      '?',
    ],
  ],
  [9, ['Opponent {tag} spotted', [MessageTag.Unit, MessageTag.Faction], '.']],
  [10, ['What a {tag}', [MessageTag.Comment, MessageTag.Social], '!']],
  [11, ['Good {tag}', [MessageTag.Social, MessageTag.Teamplay], '.']],
  [
    12,
    [
      'If only I had {tag}',
      [MessageTag.Unit, MessageTag.Building, MessageTag.Skill, MessageTag.Resource],
      '…',
    ],
  ],
  [
    13,
    [
      '{tag} is vulnerable',
      [MessageTag.Unit, MessageTag.Building, MessageTag.Faction, MessageTag.Strategy],
      '.',
    ],
  ],
  [14, ['Hold this {tag}', [MessageTag.Building, MessageTag.Tile], '.']],
  [
    15,
    [
      'Great use of {tag}',
      [
        MessageTag.Unit,
        MessageTag.Skill,
        MessageTag.Tile,
        MessageTag.Resource,
        MessageTag.Strategy,
        MessageTag.Teamplay,
      ],
      '.',
    ],
  ],
  [16, ['Beware, {tag}', [MessageTag.Unit, MessageTag.Threat], '.']],
  [
    17,
    [
      "Don't forget {tag}",
      [
        MessageTag.Unit,
        MessageTag.Faction,
        MessageTag.Skill,
        MessageTag.Resource,
        MessageTag.Strategy,
      ],
      '.',
    ],
  ],
  [
    18,
    [
      '{tag} was a mistake',
      [
        MessageTag.Unit,
        MessageTag.Building,
        MessageTag.Skill,
        MessageTag.Strategy,
        MessageTag.Comment,
        MessageTag.Teamplay,
      ],
      '.',
    ],
  ],
  [
    19,
    [
      'We need more {tag}',
      [MessageTag.Unit, MessageTag.Skill, MessageTag.Resource, MessageTag.Teamplay],
      '.',
    ],
  ],
  [
    20,
    [
      'This {tag} is key',
      [MessageTag.Building, MessageTag.Skill, MessageTag.Tile, MessageTag.Strategy],
      '.',
    ],
  ],
  [
    21,
    [
      'Victory through {tag}',
      [
        MessageTag.Skill,
        MessageTag.Social,
        MessageTag.Comment,
        MessageTag.Strategy,
        MessageTag.Teamplay,
      ],
      '.',
    ],
  ],
  [
    22,
    ['Perfect spot for {tag}', [MessageTag.Unit, MessageTag.Building, MessageTag.Strategy], '.'],
  ],
  [
    23,
    [
      'Praise the {tag}',
      [
        MessageTag.Unit,
        MessageTag.Building,
        MessageTag.Tile,
        MessageTag.Strategy,
        MessageTag.Comment,
        MessageTag.Social,
        MessageTag.Teamplay,
      ],
      '!',
    ],
  ],
  [
    24,
    [
      'Help with {tag}',
      [
        MessageTag.Unit,
        MessageTag.Building,
        MessageTag.Faction,
        MessageTag.Tile,
        MessageTag.Strategy,
        MessageTag.Threat,
      ],
      '!',
    ],
  ],
  [25, ['Oops, {tag}', [MessageTag.Faction, MessageTag.Comment, MessageTag.Social], '!']],
  [
    26,
    [
      'You forgot {tag}',
      [
        MessageTag.Unit,
        MessageTag.Building,
        MessageTag.Skill,
        MessageTag.Faction,
        MessageTag.Resource,
        MessageTag.Strategy,
      ],
      '.',
    ],
  ],
  [
    27,
    [
      'Next time, bring {tag}',
      [
        MessageTag.Unit,
        MessageTag.Building,
        MessageTag.Skill,
        MessageTag.Faction,
        MessageTag.Resource,
        MessageTag.Strategy,
      ],
      '.',
    ],
  ],
  [28, ['Construct {tag}', [MessageTag.Building], '.']],
  [29, ['Move to {tag}', [MessageTag.Tile, MessageTag.Building], '.']],
  [30, ['Destroy {tag}', [MessageTag.Building], '!']],
  [31, ['Escort {tag}', [MessageTag.Unit], '!']],
]);
