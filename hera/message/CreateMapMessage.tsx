import dateNow from '@deities/apollo/lib/dateNow.tsx';
import { getBuildingInfoOrThrow } from '@deities/athena/info/Building.tsx';
import { getUnitInfoOrThrow, SecretUnits } from '@deities/athena/info/Unit.tsx';
import getBiomeBuildingRestrictions from '@deities/athena/lib/getBiomeBuildingRestrictions.tsx';
import getBiomeUnitRestrictions from '@deities/athena/lib/getBiomeUnitRestrictions.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import {
  numberToPlayerID,
  PlayerID,
  PlayerIDs,
  toPlayerID,
} from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import {
  isEntityMessageTag,
  isValidMapMessageValue,
  MapMessage,
  MapMessageValue,
  MessageConjunctions,
  MessageTag,
  messageTagHasPlayerID,
  MessageTemplate,
  MessageTemplateEntry,
  MessageVocabulary,
  PlainMapMessage,
  toPlainMapMessage,
} from '@deities/athena/message/Message.tsx';
import { ButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import getTagColor from '@deities/ui/lib/getTagColor.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import { css, cx } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import Back from '@iconify-icons/pixelarticons/corner-up-left.js';
import Forward from '@iconify-icons/pixelarticons/forward.js';
import isPresent from '@nkzw/core/isPresent.js';
import { ReactNode, RefObject, useCallback, useMemo, useState } from 'react';
import { resetBehavior } from '../behavior/Behavior.tsx';
import { GameUser } from '../hooks/useUserMap.tsx';
import {
  TranslatedMessageConjunctions,
  TranslatedMessagePunctuation,
  TranslatedMessageTemplate,
} from '../i18n/MessageMap.tsx';
import { Actions, ClientMapMessage, PlayerDetails } from '../Types.tsx';
import PlayerIcon from '../ui/PlayerIcon.tsx';
import getTranslatedMessageTagName from './getTranslatedMessageTagName.tsx';
import MapMessageContainer from './MapMessageContainer.tsx';
import MapMessageTemplate from './MapMessageTemplate.tsx';
import MessageTagValue from './MessageTagValue.tsx';

type PartialPlainMapMessage = Omit<Partial<PlainMapMessage>, 'value'> &
  Readonly<{ value: Partial<MapMessageValue> }>;

const MessageTemplateListItem = ({
  hasNext = false,
  id,
  isNext = false,
  message,
  replacement,
  setTemplate,
}: {
  hasNext?: boolean;
  id: number;
  isNext?: boolean;
  message: string;
  replacement?: ReactNode | null;
  setTemplate?: (template: number) => void;
  tags: ReadonlyArray<MessageTag>;
}) => (
  <Stack>
    <div
      className={cx(messageStyle, setTemplate && cx(ButtonStyle, linkStyle))}
      onClick={setTemplate ? () => setTemplate(id) : undefined}
    >
      <MapMessageTemplate
        hasNext={hasNext}
        isNext={isNext}
        message={message}
        punctuation={TranslatedMessagePunctuation.get(id)?.() || '.'}
        replacement={
          replacement || (
            <Tag
              className={placeholderStyle}
              color={getTagColor(String(id))}
              isMessage
              tag={'_'.repeat(4)}
            />
          )
        }
      />
    </div>
  </Stack>
);

const ComposeMessage = ({
  biome,
  conjunction,
  id,
  isNext,
  next,
  removeTemplate,
  setConjunction,
  setNext,
  setTemplate,
  setValue,
  template,
  value: [tag, value, player],
}: {
  biome: Biome;
  conjunction?: number | null;
  id: number | null;
  isNext?: boolean;
  next?: PartialPlainMapMessage | null;
  removeTemplate: () => void;
  setConjunction?: (conjunction: number | null) => void;
  setNext?: (next: PartialPlainMapMessage | null) => void;
  setTemplate: (template: number | null) => void;
  setValue: (value: Partial<MapMessageValue>) => void;
  template: MessageTemplateEntry | null;
  value: Partial<MapMessageValue>;
}) => {
  if (id == null || template == null) {
    return <MessageTemplateList isNext={isNext} setTemplate={setTemplate} />;
  }

  const [message, tags] = template;
  const unitRestrictions = getBiomeUnitRestrictions(biome);
  const buildingRestrictions = getBiomeBuildingRestrictions(biome);
  const translatedTemplate = TranslatedMessageTemplate.get(id)?.();
  const replacement =
    tag != null ? (
      value != null ? (
        <MessageTagValue
          biome={biome}
          isFirst={!!translatedTemplate?.startsWith('{')}
          onRemove={() => setValue([tag, undefined, player ?? 1])}
          player={player ?? 1}
          playerDetails={null}
          tag={tag}
          value={value}
        />
      ) : (
        <Tag
          className={tagStyle}
          color={numberToPlayerID(tag)}
          isMessage
          key={tag}
          onRemove={() => {
            if (tags.length === 1) {
              removeTemplate();
            } else {
              setValue([]);
            }
          }}
          tag={getTranslatedMessageTagName(tag)}
        />
      )
    ) : null;

  return (
    <Stack
      gap={value == null && tag === MessageTag.Building ? 16 : true}
      vertical
    >
      <Stack gap nowrap stretch>
        <MessageTemplateListItem
          hasNext={conjunction != null}
          id={id}
          isNext={isNext}
          message={translatedTemplate || message}
          replacement={replacement}
          tags={tags}
        />
        <Icon
          button
          className={iconStyle}
          icon={Back}
          onClick={removeTemplate}
        />
      </Stack>
      <Stack gap nowrap stretch>
        <Stack gap stretch vertical>
          {value ? (
            setConjunction && setNext ? (
              <>
                <Stack gap start>
                  {conjunction != null ? (
                    <Tag
                      color={numberToPlayerID(conjunction)}
                      key={conjunction}
                      onRemove={() => setConjunction(null)}
                      tag={TranslatedMessageConjunctions.get(conjunction)!()}
                    />
                  ) : (
                    [...MessageConjunctions]
                      .map(([id]) => {
                        const conjunction =
                          TranslatedMessageConjunctions.get(id)?.();
                        return conjunction ? (
                          <Tag
                            color={numberToPlayerID(id)}
                            key={id}
                            onClick={() => setConjunction(id)}
                            tag={conjunction}
                          />
                        ) : null;
                      })
                      .filter(isPresent)
                  )}
                </Stack>
                {conjunction != null && (
                  <ComposeMessage
                    biome={biome}
                    id={next?.template ?? null}
                    isNext
                    removeTemplate={() => setNext(null)}
                    setTemplate={(template: number | null) =>
                      setNext(template ? { template, value: [] } : null)
                    }
                    setValue={(value) => setNext({ ...next, value })}
                    template={
                      (next?.template != null &&
                        MessageTemplate.get(next.template)) ||
                      null
                    }
                    value={next?.value || []}
                  />
                )}
              </>
            ) : null
          ) : tag ? (
            <>
              <Stack
                gap={tag === MessageTag.Building ? 16 : true}
                start
                vertical={isEntityMessageTag(tag) || undefined}
              >
                {[...(MessageVocabulary.get(tag) || [])]
                  .map(([id]) => {
                    if (tag === MessageTag.Unit) {
                      const unit = getUnitInfoOrThrow(id);
                      if (
                        SecretUnits.has(unit) ||
                        unitRestrictions?.has(unit.type)
                      ) {
                        return null;
                      }
                    } else if (
                      tag === MessageTag.Building &&
                      buildingRestrictions?.has(getBuildingInfoOrThrow(id))
                    ) {
                      return null;
                    }

                    return (
                      <Stack key={id} nowrap start>
                        <div
                          className={ButtonStyle}
                          onClick={() => setValue([tag, id, player ?? 1])}
                        >
                          <MessageTagValue
                            biome={biome}
                            isFirst
                            player={player ?? 1}
                            playerDetails={null}
                            tag={tag}
                            value={id}
                          />
                        </div>
                      </Stack>
                    );
                  })
                  .filter(isPresent)}
              </Stack>
            </>
          ) : (
            <Stack gap start>
              {tags.map((tag) => (
                <Tag
                  color={numberToPlayerID(tag)}
                  key={tag}
                  onClick={() => setValue([tag])}
                  tag={getTranslatedMessageTagName(tag)}
                />
              ))}
            </Stack>
          )}
        </Stack>
        {conjunction == null && tag && messageTagHasPlayerID(tag) && (
          <Stack gap start vertical>
            {PlayerIDs.map((id) => (
              <PlayerIcon
                id={id}
                key={id}
                onClick={() => setValue([tag, value, id])}
                scale={0.7}
                selected={player === id}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

const MessageTemplateList = ({
  isNext,
  setTemplate,
}: {
  isNext?: boolean;
  setTemplate: (template: number) => void;
}) => (
  <Stack gap vertical>
    {[...MessageTemplate]
      .map(([id, [, tags]]) => {
        const message = TranslatedMessageTemplate.get(id)?.();
        return message ? (
          <MessageTemplateListItem
            id={id}
            isNext={isNext}
            key={id}
            message={message}
            setTemplate={setTemplate}
            tags={tags}
          />
        ) : null;
      })
      .filter(isPresent)}
  </Stack>
);

export default function CreateMapMessage({
  animationConfig,
  biome,
  maskRef,
  onCreate,
  player,
  playerDetails,
  scale,
  update,
  user,
  vector,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  biome: Biome;
  maskRef: RefObject<HTMLDivElement | null>;
  onCreate: (message: MapMessage<Vector>) => Promise<string>;
  player: PlayerID | null;
  playerDetails: PlayerDetails;
  scale: number;
  update: Actions['update'];
  user: GameUser;
  vector: Vector;
  zIndex: number;
}) {
  const [template, _setTemplate] = useState<number | null>(null);
  const [value, _setValue] = useState<Partial<MapMessageValue>>([]);
  const [conjunction, _setConjunction] = useState<number | null>(null);
  const [next, setNext] = useState<PartialPlainMapMessage | null>(null);

  const currentTemplate =
    (template != null && MessageTemplate.get(template)) || null;

  const setTemplate = useCallback((template: number | null) => {
    _setTemplate(template);
    const tags = template != null ? MessageTemplate.get(template)?.[1] : null;
    _setValue([tags?.length === 1 ? tags[0] : undefined] as const);
    _setConjunction(null);
    setNext(null);
  }, []);

  const setValue = useCallback((value: Partial<MapMessageValue>) => {
    _setValue(value);
    _setConjunction(null);
    setNext(null);
  }, []);

  const setConjunction = useCallback((conjunction: number | null) => {
    _setConjunction(conjunction);
    setNext(null);
  }, []);

  const currentPlayer = player || toPlayerID(user.character.color);
  const nextMessage = useMemo(
    () => (next ? toPlainMapMessage({ ...next, player: currentPlayer }) : null),
    [currentPlayer, next],
  );

  const canSend = useMemo(
    () =>
      currentTemplate &&
      isValidMapMessageValue(value) &&
      (conjunction == null || nextMessage),
    [conjunction, currentTemplate, nextMessage, value],
  );

  const close = useCallback(
    () =>
      update({
        selectedMessagePosition: null,
      }),
    [update],
  );

  const create = useCallback(async () => {
    if (template && isValidMapMessageValue(value)) {
      const message = {
        conjunction: conjunction ?? undefined,
        next: nextMessage || undefined,
        player: currentPlayer,
        position: vector,
        template,
        value,
      } satisfies MapMessage<Vector>;

      const clientMessage: ClientMapMessage = {
        ...message,
        id: `ClientMessage-${dateNow().toString(36)}`,
        isValuable: false,
        user,
        viewerLiked: true,
      };

      await update(({ messages }) => ({
        messages: new Map(messages).set(vector, clientMessage),
        ...resetBehavior(),
      }));

      const id = await onCreate(message);
      await update(({ messages }) => ({
        messages: new Map(messages).set(vector, { ...clientMessage, id }),
      }));
    }
  }, [
    conjunction,
    currentPlayer,
    nextMessage,
    onCreate,
    template,
    update,
    user,
    value,
    vector,
  ]);

  return user ? (
    <MapMessageContainer
      animationConfig={animationConfig}
      button={
        <Stack
          alignCenter
          center
          className={cx(buttonStyle, canSend && cx(ButtonStyle, submitStyle))}
          gap={4}
          nowrap
          onClick={canSend ? create : undefined}
        >
          <Icon className={sendIconStyle} icon={Forward} />
          <div>
            <fbt desc="Send message button">Send</fbt>
          </div>
        </Stack>
      }
      maskRef={maskRef}
      player={player}
      playerDetails={playerDetails}
      scale={scale}
      scroll
      user={user}
      vector={vector}
      zIndex={zIndex}
    >
      {template == null && (
        <Icon
          button
          className={absoluteIconStyle}
          icon={Close}
          onClick={close}
        />
      )}
      <ComposeMessage
        biome={biome}
        conjunction={conjunction}
        id={template}
        next={next}
        removeTemplate={() => setTemplate(null)}
        setConjunction={setConjunction}
        setNext={setNext}
        setTemplate={setTemplate}
        setValue={setValue}
        template={currentTemplate}
        value={value}
      />
    </MapMessageContainer>
  ) : null;
}

const placeholderStyle = css`
  letter-spacing: -2px;
`;

const linkStyle = css`
  @media (hover: hover) {
    &:hover {
      color: ${applyVar('highlight-color')};
    }
  }
`;

const messageStyle = css`
  line-height: 30px;
`;

const sendIconStyle = css`
  height: ${TileSize}px;
  width: ${TileSize}px;
`;

const absoluteIconStyle = css`
  position: absolute;
  right: 12px;
  top: 16px;
`;

const iconStyle = css`
  margin-top: 4px;
  flex-shrink: 0;
`;

const buttonStyle = css`
  opacity: 0;
  padding-right: 4px;
  transition: opacity 200ms ease-in-out;
`;

const submitStyle = css`
  opacity: 1;
`;

const tagStyle = css`
  text-decoration: wavy underline 2px;
`;
