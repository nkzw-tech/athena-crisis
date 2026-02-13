import { getBuildingInfoOrThrow } from '@deities/athena/info/Building.tsx';
import { getTileInfo } from '@deities/athena/info/Tile.tsx';
import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { PlayerID, toPlayerID } from '@deities/athena/map/Player.tsx';
import { MessageTag } from '@deities/athena/message/Message.tsx';
import Tag from '@deities/ui/Tag.tsx';
import { css, cx } from '@emotion/css';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { ReactNode } from 'react';
import { TranslatedMessageVocabulary } from '../i18n/MessageMap.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import { PlayerDetails } from '../Types.tsx';
import { BuildingName, TileName, UnitName } from '../ui/InlineEntity.tsx';
import { SkillIcon } from '../ui/SkillDialog.tsx';
import getTranslatedMessageTagName from './getTranslatedMessageTagName.tsx';

const emptyMap = new Map();

export default function MessageTagValue({
  biome,
  isFirst,
  onRemove,
  player,
  playerDetails,
  tag,
  value,
}: {
  biome: Biome;
  isFirst: boolean;
  onRemove?: () => void;
  player: PlayerID;
  playerDetails: PlayerDetails | null;
  tag: MessageTag;
  value: number;
}): ReactNode {
  switch (tag) {
    case MessageTag.Building:
      return (
        <BuildingName
          building={getBuildingInfoOrThrow(value)}
          buildingColor={player}
          color={player}
          isMessage
          onRemove={onRemove}
          size="medium"
        />
      );
    case MessageTag.Unit:
      return (
        <UnitName
          color={player}
          isMessage
          onRemove={onRemove}
          size="medium"
          unit={getUnitInfoOrThrow(value)}
          unitColor={player}
        />
      );
    case MessageTag.Tile:
      return (
        <span className={inlineStyle}>
          <TileName
            biome={biome}
            isMessage
            onRemove={onRemove}
            size="medium"
            tile={getTileInfo(value)}
          />
        </span>
      );
    case MessageTag.Skill:
      return (
        <span className={cx(inlineStyle, skillStyle)}>
          <SkillIcon hideDialog showName skill={value} />
        </span>
      );
    case MessageTag.Faction:
      return (
        <Tag
          color={toPlayerID(value)}
          isMessage
          onRemove={onRemove}
          size="medium"
          tag={getTranslatedFactionName(playerDetails || emptyMap, toPlayerID(value))}
        />
      );
    case MessageTag.Comment:
    case MessageTag.Resource:
    case MessageTag.Social:
    case MessageTag.Strategy:
    case MessageTag.Teamplay:
    case MessageTag.Threat: {
      const vocabulary = TranslatedMessageVocabulary.get(tag)?.get(value)?.();
      return vocabulary ? (
        <Tag capitalize={isFirst} isMessage onRemove={onRemove} size="medium" tag={vocabulary} />
      ) : (
        getTranslatedMessageTagName(tag)
      );
    }
    default: {
      tag satisfies never;
      throw new UnknownTypeError('getEntityTagValue', tag);
    }
  }
}

const inlineStyle = css`
  display: inline-block;
  white-space: nowrap;
`;

const skillStyle = css`
  line-height: 20px;
`;
