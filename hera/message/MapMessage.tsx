import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { toPlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import {
  MapMessage,
  PlainMapMessage,
} from '@deities/athena/message/Message.tsx';
import { ButtonStyle } from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Reply from '@iconify-icons/pixelarticons/reply.js';
import Trash from '@iconify-icons/pixelarticons/trash.js';
import { ReactNode, RefObject } from 'react';
import { UserLikeWithID } from '../hooks/useUserMap.tsx';
import {
  TranslatedMessageConjunctions,
  TranslatedMessagePunctuation,
  TranslatedMessageTemplate,
} from '../i18n/MessageMap.tsx';
import {
  Actions,
  ClientMapMessage,
  PartialClientMapMessage,
  PlayerDetails,
} from '../Types.tsx';
import StarIcon from '../ui/StarIcon.tsx';
import MapMessageContainer, {
  getMessagePlayer,
} from './MapMessageContainer.tsx';
import MapMessageTemplate from './MapMessageTemplate.tsx';
import MessageTagValue from './MessageTagValue.tsx';

export function getMessageContent<
  T extends PlainMapMessage | MapMessage<Vector | [x: number, y: number]>,
>(
  message: T,
  playerDetails: PlayerDetails | null,
  biome: Biome,
  isNext: boolean = false,
): ReactNode | null {
  const template = TranslatedMessageTemplate.get(message.template)?.();
  const punctuation =
    TranslatedMessagePunctuation.get(message.template)?.() || '.';
  if (!template) {
    return null;
  }

  const conjunction = 'conjunction' in message ? message.conjunction : null;
  const next = 'next' in message && message.next;
  const translatedConjunction =
    (conjunction != null &&
      TranslatedMessageConjunctions.get(conjunction)?.()) ||
    null;

  const nextMessage =
    conjunction != null && next
      ? getMessageContent(next, playerDetails, biome, true)
      : null;
  const hasNext = !!(
    nextMessage &&
    translatedConjunction &&
    conjunction != null
  );

  const [tag, value, player] = message.value;
  const content = (
    <>
      <MapMessageTemplate
        hasNext={hasNext}
        isNext={isNext}
        message={template}
        punctuation={punctuation}
        replacement={
          <MessageTagValue
            biome={biome}
            isFirst={!isNext && template.startsWith('{')}
            player={player != null ? toPlayerID(player) : message.player}
            playerDetails={playerDetails}
            tag={tag}
            value={value}
          />
        }
      />
      {hasNext && (
        <>
          {' '}
          {translatedConjunction} {nextMessage}
        </>
      )}
    </>
  );
  return isNext ? content : <div className={messageStyle}>{content}</div>;
}

export default function MapMessageComponent({
  animationConfig,
  biome,
  currentUser,
  deleteMessage,
  maskRef,
  message,
  playerDetails,
  scale,
  toggleLikeMessage,
  update,
  vector,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  biome: Biome;
  currentUser: UserLikeWithID | undefined;
  deleteMessage: ((id: string) => Promise<void>) | undefined;
  maskRef: RefObject<HTMLDivElement | null>;
  message: ClientMapMessage;
  playerDetails: PlayerDetails;
  scale: number;
  toggleLikeMessage:
    | ((id: string) => Promise<PartialClientMapMessage>)
    | undefined;
  update: Actions['update'];
  vector: Vector;
  zIndex: number;
}) {
  const { player, user, viewerLiked } = message;

  const messageContent = getMessageContent(message, playerDetails, biome);
  const playerID = getMessagePlayer(user, player, playerDetails);

  return messageContent ? (
    <MapMessageContainer
      animationConfig={animationConfig}
      button={
        <Stack className={rightPaddingStyle} gap nowrap>
          {deleteMessage && currentUser?.id === message.user.id && (
            <Stack
              alignCenter
              center
              className={ButtonStyle}
              gap={4}
              nowrap
              onClick={() => {
                deleteMessage(message.id);
                update((state) => {
                  const messages = new Map(state.messages);
                  messages.delete(vector);
                  return { messages };
                });
              }}
            >
              <Icon icon={Trash} />
              <div>
                <fbt desc="Remove button">Remove</fbt>
              </div>
            </Stack>
          )}
          {toggleLikeMessage &&
            currentUser &&
            currentUser?.id !== message.user.id && (
              <Stack
                alignCenter
                center
                className={cx(
                  viewerLiked &&
                    (playerID === 2 || playerID === 7 || playerID === 3
                      ? alternateLikedStyle
                      : likedStyle),
                  ButtonStyle,
                )}
                gap={4}
                nowrap
                onClick={async () => {
                  const [, result] = await Promise.all([
                    update((state) => ({
                      messages: new Map(state.messages).set(vector, {
                        ...message,
                        viewerLiked: !viewerLiked,
                      }),
                    })),
                    await toggleLikeMessage(message.id),
                  ] as const);

                  await update((state) => ({
                    messages: new Map(state.messages).set(vector, {
                      ...message,
                      ...result,
                    }),
                  }));
                }}
              >
                <Icon className={cx(iconStyle, rotateUpStyle)} icon={Reply} />
                <div>
                  {viewerLiked ? (
                    <fbt desc="Liked button">Liked</fbt>
                  ) : (
                    <fbt desc="Like button">Like</fbt>
                  )}
                </div>
              </Stack>
            )}
        </Stack>
      }
      isValuable={message.isValuable}
      maskRef={maskRef}
      player={player}
      playerDetails={playerDetails}
      scale={scale}
      user={user}
      vector={vector}
      zIndex={zIndex}
    >
      {message.isValuable && (
        <StarIcon className={starStyle} size="small" type="achieved" />
      )}
      {messageContent}
    </MapMessageContainer>
  ) : null;
}

const messageStyle = css`
  line-height: 30px;
  user-select: text;
`;

const rightPaddingStyle = css`
  padding-right: 4px;
`;

const iconStyle = css`
  height: ${TileSize}px;
  width: ${TileSize}px;
`;

const rotateUpStyle = css`
  transform: rotate(90deg);
`;

const likedStyle = css`
  color: ${applyVar('color-gold')};
`;

const alternateLikedStyle = css`
  color: ${getColor('red')};
`;

const starStyle = css`
  position: absolute;
  right: 12px;
  top: 14px;
`;
